import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = { SimSDController: { setRoomContext() {}, setReadOnly() {} } };
globalThis.location = { protocol: 'http:', host: 'localhost' };
class FakeSocket {
  static OPEN = 1;
  readyState = 1;
  listeners = new Map();
  messages = [];
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  send(value) { this.messages.push(JSON.parse(value)); }
  receive(value) { this.listeners.get('message')({ data: JSON.stringify(value) }); }
  close() { this.readyState = 3; }
}
globalThis.WebSocket = FakeSocket;
const { sessionSync } = await import('../src/sessionSync.js');

test('flush saves the last debounced action and waits for its acknowledgement', async () => {
  sessionSync.open({ id: 'room', status: 'open' });
  const socket = sessionSync.socket;
  sessionSync.pushState({ notes: ['last note'] });
  const saving = sessionSync.flushPending();
  assert.deepEqual(socket.messages[0].state.notes, ['last note']);
  socket.receive({ type: 'state:ack', version: 1 });
  await saving;
  sessionSync.close();
});

test('rapid writes wait for acknowledgement and use the next version', async () => {
  sessionSync.open({ id: 'room', status: 'open' });
  const socket = sessionSync.socket;
  sessionSync.pushState({ events: ['speech.started'] }, true);
  sessionSync.pushState({ events: ['speech.started', 'speech.finished'] }, true);
  assert.equal(socket.messages.length, 1);
  const saving = sessionSync.flushPending();
  socket.receive({ type: 'state:ack', version: 1 });
  assert.equal(socket.messages.length, 2);
  assert.equal(socket.messages[1].baseVersion, 1);
  assert.equal(socket.messages[1].state.events.length, 2);
  socket.receive({ type: 'state:ack', version: 2 });
  await saving;
  sessionSync.close();
});

test('failed saves reject flush rather than reporting a successful export', async () => {
  sessionSync.open({ id: 'room', status: 'open' });
  sessionSync.pushState({ notes: ['pending'] });
  const saving = sessionSync.flushPending();
  sessionSync.socket.receive({ type: 'error', message: 'Falha no salvamento' });
  await assert.rejects(saving, /Falha no salvamento/);
  assert.deepEqual(sessionSync.pendingState.notes, ['pending']);
  sessionSync.close();
});
