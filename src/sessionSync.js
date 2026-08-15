class SessionSync {
  constructor() {
    this.socket = null;
    this.room = null;
    this.version = 0;
    this.pushTimer = null;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event) {
    for (const listener of this.listeners) listener(event);
  }

  open(room) {
    this.close();
    this.room = room;
    window.SimSDController?.setRoomContext(room.id);
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.socket = new WebSocket(`${protocol}//${location.host}/ws?roomId=${encodeURIComponent(room.id)}`);
    this.emit({ type: 'status', status: 'connecting' });
    this.socket.addEventListener('open', () => this.emit({ type: 'status', status: 'connected' }));
    this.socket.addEventListener('close', () => this.emit({ type: 'status', status: 'disconnected' }));
    this.socket.addEventListener('error', () => this.emit({ type: 'status', status: 'error' }));
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.type === 'state:init') {
        this.version = message.version || 0;
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
        this.version = message.version || this.version;
        window.SimSDController?.applyRemoteState(message.state);
        this.emit({ type: 'remote-update', user: message.updatedBy, updatedAt: message.updatedAt });
      } else if (message.type === 'state:conflict') {
        clearTimeout(this.pushTimer);
        this.version = message.version || this.version;
        window.SimSDController?.applyRemoteState(message.state);
        this.emit({ type: 'error', message: 'Outra alteração chegou primeiro; a sala foi atualizada.' });
      } else if (message.type === 'state:ack') {
        this.version = message.version || this.version;
      } else if (message.type === 'presence') {
        this.emit({ type: 'presence', count: message.count, users: message.users });
      } else if (message.type === 'room:closed') {
        this.emit({ type: 'closed', report: message.report });
      } else if (message.type === 'error') {
        this.emit({ type: 'error', message: message.message });
      }
    });
  }

  pushState(state, immediate = false) {
    if (!state || !this.room) return;
    clearTimeout(this.pushTimer);
    const send = () => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'state:update', state, baseVersion: this.version }));
      }
    };
    if (immediate) send();
    else this.pushTimer = setTimeout(send, 120);
  }

  async closeRoom(state = window.SimSDController?.snapshot()) {
    if (!this.room) return null;
    clearTimeout(this.pushTimer);
    const response = await fetch(`/api/rooms/${this.room.id}/close`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Não foi possível encerrar a sala.');
    return data.report;
  }

  close() {
    clearTimeout(this.pushTimer);
    this.socket?.close();
    this.socket = null;
    this.room = null;
    this.version = 0;
  }
}

export const sessionSync = new SessionSync();
window.SimSDSync = sessionSync;
