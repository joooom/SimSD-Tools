class SessionSync {
  constructor() {
    this.socket = null;
    this.room = null;
    this.version = 0;
    this.pushTimer = null;
    this.pendingState = null;
    this.sending = false;
    this.inFlightState = null;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event) {
    for (const listener of this.listeners) listener(event);
  }

  open(room, options = {}) {
    this.close();
    this.room = room;
    window.SimSDController?.setRoomContext(room.id);
    window.SimSDController?.setReadOnly?.(room.status === 'closed');
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl = `${protocol}//${location.host}/ws?roomId=${encodeURIComponent(room.id)}`;
    if (options.mode) wsUrl += `&mode=${encodeURIComponent(options.mode)}`;
    this.socket = new WebSocket(wsUrl);
    this.emit({ type: 'status', status: 'connecting' });
    this.socket.addEventListener('open', () => this.emit({ type: 'status', status: 'connected' }));
    this.socket.addEventListener('close', () => this.emit({ type: 'status', status: 'disconnected' }));
    this.socket.addEventListener('error', () => this.emit({ type: 'status', status: 'error' }));
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.type === 'state:init') {
        this.version = message.version || 0;
        this.room.status = message.room.status;
        window.SimSDController?.setReadOnly?.(this.room.status === 'closed');
        if (message.room?.status === 'closed') {
          if (message.state) window.SimSDController?.applyRemoteState(message.state);
          this.emit({ type: 'closed' });
          return;
        }
        if (message.state) window.SimSDController?.applyRemoteState(message.state);
        else {
          window.SimSDController?.startFreshRoom(room.committeeKey);
          this.pushState(window.SimSDController?.snapshot(), true);
        }
      } else if (message.type === 'state:update') {
        clearTimeout(this.pushTimer);
        if (this.pendingState) this.emit({ type: 'error', message: 'Outra alteração chegou antes do salvamento; confira sua última ação.' });
        this.pendingState = null;
        this.version = message.version || this.version;
        window.SimSDController?.applyRemoteState(message.state);
        this.emit({ type: 'remote-update', user: message.updatedBy, updatedAt: message.updatedAt });
      } else if (message.type === 'state:conflict') {
        clearTimeout(this.pushTimer);
        this.pendingState = null;
        this.sending = false;
        this.inFlightState = null;
        this.version = message.version || this.version;
        window.SimSDController?.applyRemoteState(message.state);
        this.emit({ type: 'error', message: 'Outra alteração chegou primeiro; a sala foi atualizada.' });
      } else if (message.type === 'state:ack') {
        this.version = message.version || this.version;
        this.sending = false;
        this.inFlightState = null;
        this.sendPending();
        if (!this.sending && !this.pendingState) this.emit({ type: 'saved' });
      } else if (message.type === 'presence') {
        this.emit({ type: 'presence', count: message.count, users: message.users });
      } else if (message.type === 'room:closed') {
        clearTimeout(this.pushTimer);
        this.pendingState = null;
        this.sending = false;
        this.inFlightState = null;
        this.room.status = 'closed';
        this.version = message.version ?? this.version;
        window.SimSDController?.setReadOnly?.(true);
        if (message.state) window.SimSDController?.applyRemoteState(message.state);
        this.emit({ type: 'closed', report: message.report });
      } else if (message.type === 'room:reopened') {
        clearTimeout(this.pushTimer);
        this.pendingState = null;
        this.sending = false;
        this.inFlightState = null;
        this.room.status = 'open';
        this.version = message.version;
        window.SimSDController?.setReadOnly?.(false);
        if (message.state) window.SimSDController?.applyRemoteState(message.state);
        else window.SimSDController?.startFreshRoom(room.committeeKey);
        this.emit({ type: 'reopened' });
      } else if (message.type === 'error') {
        this.pendingState = this.room?.status === 'open' ? (this.pendingState || this.inFlightState) : null;
        this.inFlightState = null;
        this.sending = false;
        this.emit({ type: 'error', message: message.message });
      }
    });
  }

  pushState(state, immediate = false) {
    if (!state || !this.room || this.room.status === 'closed') return;
    clearTimeout(this.pushTimer);
    this.pendingState = state;
    if (immediate) this.sendPending();
    else this.pushTimer = setTimeout(() => this.sendPending(), 120);
  }

  sendPending() {
    if (!this.pendingState || this.sending || this.room?.status !== 'open' || this.socket?.readyState !== WebSocket.OPEN) return;
    clearTimeout(this.pushTimer);
    const state = this.pendingState;
    this.pendingState = null;
    this.sending = true;
    this.inFlightState = state;
    this.socket.send(JSON.stringify({ type: 'state:update', state, baseVersion: this.version }));
  }

  async flushPending() {
    if (!this.pendingState && !this.sending) return;
    if (this.socket?.readyState !== WebSocket.OPEN) throw new Error('Aguarde a conexão para salvar sua última ação.');
    await new Promise((resolve, reject) => {
      const finish = error => { clearTimeout(timer); unsubscribe(); error ? reject(error) : resolve(); };
      const unsubscribe = this.subscribe(event => {
        if (event.type === 'saved') finish();
        else if (event.type === 'error') finish(new Error(event.message));
        else if (event.type === 'closed') finish(new Error('A sala foi encerrada durante o salvamento. Confira o estado atualizado.'));
      });
      const timer = setTimeout(() => finish(new Error('O salvamento ainda não foi confirmado. Tente novamente.')), 5000);
      this.sendPending();
    });
  }

  async closeRoom(state = window.SimSDController?.snapshot()) {
    if (!this.room) return null;
    clearTimeout(this.pushTimer);
    this.pendingState = null;
    const response = await fetch(`/api/rooms/${this.room.id}/close`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Não foi possível encerrar a sala.');
    return data.report;
  }

  close() {
    window.SimSDController?.setReadOnly?.(false);
    clearTimeout(this.pushTimer);
    this.pendingState = null;
    this.sending = false;
    this.socket?.close();
    this.inFlightState = null;
    this.socket = null;
    this.room = null;
    this.version = 0;
  }
}

export const sessionSync = new SessionSync();
window.SimSDSync = sessionSync;
