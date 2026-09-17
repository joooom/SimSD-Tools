import { copyState, mergeSession, sameState } from './sessionMerge.js';

export class SessionSync {
  constructor() {
    this.socket = null; this.room = null; this.version = 0;
    this.baseState = null; this.pendingState = null; this.inFlightState = null;
    this.sending = false; this.ready = false; this.conflict = null;
    this.status = 'disconnected'; this.listeners = new Set(); this.retryCount = 0;
    this.offlineMode = false; this.persisted = false;
  }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  emit(event) { for (const listener of this.listeners) listener(event); }
  setStatus(status) { this.status = status; this.emit({ type: 'status', status }); }
  get dirty() { return Boolean(this.pendingState || this.inFlightState); }
  get localState() { return this.pendingState || this.inFlightState; }
  get showLocalWarning() { return this.dirty && (this.offlineMode || Boolean(this.conflict) || ['closed', 'error'].includes(this.status)); }
  startOfflineGrace() {
    if (this.offlineMode || this.offlineTimer != null || this.options?.mode === 'viewer') return;
    this.offlineTimer = setTimeout(() => {
      this.offlineTimer = null;
      if (!this.room || this.ready) return;
      this.offlineMode = true; this.persist(); this.emit({ type: 'offline' });
    }, 5000);
  }
  storageKey() { return `simsd-outbox-v1:${this.options?.userId || 'local'}:${this.room?.id}`; }
  persist(force = true) {
    if (!this.room || this.options.mode === 'viewer') return true;
    if (!force && this.dirty && !this.offlineMode && !this.persisted && !this.conflict && this.room.status !== 'closed') return true;
    try {
      if (this.dirty) localStorage.setItem(this.storageKey(), JSON.stringify({ schema: 1, baseState: this.baseState, state: this.localState, version: this.version }));
      else { localStorage.removeItem(this.storageKey()); if (this.ready) this.offlineMode = false; }
      this.persisted = this.dirty;
      return true;
    } catch {
      this.persisted = false;
      this.emit({ type: 'error', message: 'Não foi possível guardar a fila no dispositivo. Mantenha esta aba aberta ou baixe uma cópia das alterações.' });
      return false;
    }
  }
  open(room, options = {}) {
    this.close(); this.room = { ...room }; this.options = options; this.retryCount = 0;
    window.SimSDController?.setRoomContext(room.id);
    if (options.mode !== 'viewer') {
      try {
        const saved = JSON.parse(localStorage.getItem(this.storageKey()) || 'null');
        if (saved?.schema === 1 && saved.state && typeof saved.state === 'object') {
          this.baseState = saved.baseState; this.pendingState = saved.state; this.version = saved.version || 0; this.persisted = true; this.offlineMode = true;
          window.SimSDController?.applyRemoteState(saved.state);
        }
      } catch { this.emit({ type: 'error', message: 'Não foi possível ler a fila local de alterações.' }); }
    }
    window.SimSDController?.setReadOnly?.(room.status === 'closed' || !this.dirty || options.mode === 'viewer');
    this.onlineHandler = () => { if (!this.ready) this.connect(); };
    window.addEventListener?.('online', this.onlineHandler);
    this.pageHideHandler = () => { if (this.dirty) this.persist(); };
    window.addEventListener?.('pagehide', this.pageHideHandler);
    this.connect();
  }
  connect() {
    if (!this.room) return;
    clearTimeout(this.retryTimer); clearTimeout(this.connectionTimer);
    const old = this.socket; this.socket = null; old?.close();
    this.ready = false; this.setStatus('connecting');
    this.startOfflineGrace();
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    let url = `${protocol}//${location.host}/ws?roomId=${encodeURIComponent(this.room.id)}`;
    if (this.options.mode) url += `&mode=${encodeURIComponent(this.options.mode)}`;
    let socket;
    try { socket = new WebSocket(url); } catch { this.disconnected(); return; }
    this.socket = socket;
    const active = () => this.socket === socket && Boolean(this.room);
    this.connectionTimer = setTimeout(() => { if (active() && !this.ready) this.disconnected(); }, 10000);
    socket.addEventListener('close', () => { if (active()) this.disconnected(); });
    socket.addEventListener('error', () => { if (active()) this.disconnected(); });
    socket.addEventListener('message', event => {
      if (!active()) return;
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      this.receive(message);
    });
  }
  disconnected() {
    if (!this.room) return;
    const socket = this.socket; this.socket = null; socket?.close();
    clearTimeout(this.connectionTimer); clearTimeout(this.ackTimer);
    this.pendingState = this.localState; this.inFlightState = null;
    this.sending = false; this.requestId = null; this.ready = false;
    this.startOfflineGrace(); this.persist(false); this.setStatus('disconnected');
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => this.connect(), Math.min(15000, 1000 * 2 ** Math.min(this.retryCount++, 4)));
  }
  receive(message) {
    if (message.type === 'state:init') {
      clearTimeout(this.connectionTimer); this.ready = true; this.retryCount = 0;
      clearTimeout(this.offlineTimer); this.offlineTimer = null;
      this.room.status = message.room.status;
      if (this.room.status === 'closed') return this.closed(message);
      window.SimSDController?.setReadOnly?.(this.options.mode === 'viewer');
      if (message.state || this.dirty) this.reconcile(message.state, message.version);
      else {
        this.version = message.version || 0; this.baseState = null;
        window.SimSDController?.startFreshRoom(this.room.committeeKey);
        this.pushState(window.SimSDController?.snapshot(), true);
      }
      if (!this.dirty && !this.conflict) this.setStatus('connected');
    } else if (message.type === 'state:update' || message.type === 'state:conflict') {
      if (message.type === 'state:conflict' && message.requestId && message.requestId !== this.requestId) return;
      if (message.version < this.version) return;
      this.reconcile(message.state, message.version);
      this.emit({ type: 'remote-update', user: message.updatedBy, updatedAt: message.updatedAt });
    } else if (message.type === 'state:ack') {
      if (!this.sending || (message.requestId && message.requestId !== this.requestId)) return;
      clearTimeout(this.ackTimer);
      this.baseState = this.inFlightState; this.version = message.version;
      this.inFlightState = null; this.sending = false; this.requestId = null;
      this.persist(false); this.sendPending();
      if (!this.dirty) { this.setStatus('connected'); this.emit({ type: 'saved' }); }
    } else if (message.type === 'room:closed') this.closed(message);
    else if (message.type === 'room:reopened') {
      this.room.status = 'open'; window.SimSDController?.setReadOnly?.(false);
      this.reconcile(message.state, message.version); this.emit({ type: 'reopened' });
    } else if (message.type === 'room:deleted') {
      this.closed(message);
      this.emit({ type: 'error', message: 'A sala foi excluída. As alterações pendentes continuam disponíveis para download neste dispositivo.' });
    } else if (message.type === 'presence') this.emit({ type: 'presence', count: message.count, users: message.users });
    else if (message.type === 'error') {
      if (message.requestId && message.requestId !== this.requestId) return;
      clearTimeout(this.ackTimer);
      this.pendingState = this.localState; this.inFlightState = null; this.sending = false;
      this.persist(); this.setStatus('error'); this.emit({ type: 'error', message: message.message });
    }
  }
  reconcile(remote, version) {
    clearTimeout(this.pushTimer); clearTimeout(this.ackTimer);
    const local = this.localState;
    this.inFlightState = null; this.sending = false; this.requestId = null;
    if (local) {
      const merged = mergeSession(this.baseState, local, remote);
      if (merged.conflicts.length) {
        this.pendingState = local;
        this.conflict = { remote: copyState(remote), version, conflicts: merged.conflicts };
        this.persist(); this.setStatus('conflict'); this.emit({ type: 'conflict', conflicts: merged.conflicts });
        return;
      }
      this.pendingState = sameState(merged.state, remote) ? null : merged.state;
    }
    this.conflict = null; this.baseState = copyState(remote); this.version = version || 0;
    this.persist(false); window.SimSDController?.applyRemoteState(this.pendingState || remote);
    this.sendPending();
    if (!this.dirty) { this.setStatus('connected'); this.emit({ type: 'saved' }); }
  }
  resolveConflict(preference) {
    if (!this.conflict || !['local', 'remote'].includes(preference) || this.room?.status !== 'open') return;
    const { remote, version } = this.conflict;
    const merged = mergeSession(this.baseState, this.localState, remote, preference);
    this.baseState = copyState(remote); this.version = version;
    this.pendingState = sameState(merged.state, remote) ? null : merged.state; this.conflict = null;
    this.persist(); window.SimSDController?.applyRemoteState(merged.state); this.sendPending();
    if (!this.dirty) { this.setStatus('connected'); this.emit({ type: 'saved' }); }
  }
  closed(message) {
    clearTimeout(this.pushTimer); clearTimeout(this.ackTimer);
    this.pendingState = this.localState; this.inFlightState = null; this.sending = false; this.requestId = null;
    this.room.status = 'closed'; this.conflict = null;
    // Keep the original base for reconciliation if an admin reopens the room.
    if (!this.dirty) { this.baseState = copyState(message.state); this.version = message.version ?? this.version; }
    this.persist(); window.SimSDController?.setReadOnly?.(true);
    if (message.state) window.SimSDController?.applyRemoteState(message.state);
    this.setStatus('closed'); this.emit({ type: 'closed', report: message.report, pending: this.dirty });
  }
  pushState(state, immediate = false) {
    if (!state || !this.room || this.room.status === 'closed' || this.options.mode === 'viewer') return;
    clearTimeout(this.pushTimer); this.pendingState = copyState(state); this.persist(false);
    this.setStatus(this.conflict ? 'conflict' : this.ready ? 'syncing' : 'disconnected');
    if (immediate) this.sendPending();
    else this.pushTimer = setTimeout(() => this.sendPending(), 120);
  }
  sendPending() {
    if (!this.pendingState || this.sending || this.conflict || !this.ready || this.room?.status !== 'open' || this.socket?.readyState !== WebSocket.OPEN) return;
    clearTimeout(this.pushTimer);
    this.inFlightState = this.pendingState; this.pendingState = null; this.sending = true;
    this.requestId = crypto.randomUUID(); this.setStatus('syncing'); this.persist(false);
    try {
      this.socket.send(JSON.stringify({ type: 'state:update', state: this.inFlightState, baseVersion: this.version, requestId: this.requestId }));
      this.ackTimer = setTimeout(() => this.disconnected(), 10000);
    } catch { this.disconnected(); }
  }
  async flushPending() {
    if (!this.dirty) return;
    if (this.conflict) throw new Error('Resolva o conflito de sincronização antes de continuar.');
    if (!this.ready || this.socket?.readyState !== WebSocket.OPEN) throw new Error('Alterações pendentes no dispositivo. Aguarde a reconexão para concluir.');
    if (this.room?.status === 'closed') throw new Error('A sala foi encerrada. Baixe a cópia local ou reabra a sala para sincronizar.');
    await new Promise((resolve, reject) => {
      const finish = error => { clearTimeout(timer); unsubscribe(); error ? reject(error) : resolve(); };
      const unsubscribe = this.subscribe(event => {
        if (event.type === 'saved') finish();
        else if (event.type === 'error') finish(new Error(event.message));
        else if (event.type === 'conflict') finish(new Error('Há alterações conflitantes. Escolha como conciliá-las.'));
        else if (event.type === 'closed') finish(new Error('A sala foi encerrada durante o salvamento.'));
        else if (event.type === 'status' && event.status === 'disconnected') finish(new Error('Conexão perdida. As alterações continuam pendentes.'));
      });
      const timer = setTimeout(() => finish(new Error('O salvamento ainda não foi confirmado. A fila foi preservada.')), 10000);
      this.sendPending();
    });
  }
  async closeRoom(state = window.SimSDController?.snapshot()) {
    if (!this.room) return null;
    if (this.room.status === 'open') this.pushState(state, true);
    await this.flushPending();
    const response = await fetch(`/api/rooms/${this.room.id}/close`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Não foi possível encerrar a sala.');
    return data.report;
  }
  downloadPending() {
    if (!this.dirty) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify({ room: this.room, state: this.localState, baseState: this.baseState, conflict: this.conflict }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `alteracoes-pendentes-${this.room.id}.json`;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  close() {
    if (this.room && this.dirty) this.persist();
    window.removeEventListener?.('online', this.onlineHandler);
    window.removeEventListener?.('pagehide', this.pageHideHandler);
    for (const timer of [this.pushTimer, this.retryTimer, this.connectionTimer, this.ackTimer, this.offlineTimer]) clearTimeout(timer);
    this.offlineTimer = null; this.offlineMode = false; this.persisted = false;
    const socket = this.socket; this.socket = null; socket?.close();
    this.room = null; this.pendingState = null; this.inFlightState = null; this.baseState = null;
    this.conflict = null; this.sending = false; this.ready = false; this.version = 0; this.requestId = null;
    window.SimSDController?.setReadOnly?.(false);
  }
}
export const sessionSync = new SessionSync();
window.SimSDSync = sessionSync;
