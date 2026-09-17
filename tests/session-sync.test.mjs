import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

let applied;
globalThis.window = { SimSDController: { setRoomContext() {}, setReadOnly() {}, applyRemoteState(state) { applied = state; } } };
const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
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
  drop() { this.readyState = 3; this.listeners.get('close')?.(); }
}
globalThis.WebSocket = FakeSocket;
const { sessionSync } = await import('../src/sessionSync.js');
const { mergeSession } = await import('../src/sessionMerge.js');
beforeEach(() => { storage.clear(); applied = null; });
afterEach(() => sessionSync.close());
function init(state = {}, version = 0, status = 'open') {
  sessionSync.socket.receive({ type: 'state:init', state, version, room: { status } });
}

test('connected saves never activate the local recovery warning or outbox', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  sessionSync.open({ id: 'room', status: 'open' }); init({ notes: [] });
  sessionSync.pushState({ notes: [{ id: 'online' }] }, true);
  t.mock.timers.tick(5000);
  assert.equal(sessionSync.showLocalWarning, false);
  assert.equal(storage.size, 0);
  sessionSync.socket.receive({ type: 'state:ack', version: 1 });
  assert.equal(sessionSync.dirty, false);
});

test('offline recovery starts after exactly five seconds across connection retries', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  sessionSync.open({ id: 'room', status: 'open' }); init({ notes: [] });
  sessionSync.socket.drop(); sessionSync.pushState({ notes: [{ id: 'offline' }] });
  t.mock.timers.tick(4999);
  assert.equal(storage.size, 0); assert.equal(sessionSync.showLocalWarning, false);
  t.mock.timers.tick(1);
  assert.equal(storage.size, 1); assert.equal(sessionSync.showLocalWarning, true);
  init({ notes: [] });
  assert.equal(sessionSync.showLocalWarning, true, 'retain warning until server acknowledges recovery');
  sessionSync.socket.receive({ type: 'state:ack', version: 1 });
  assert.equal(storage.size, 0); assert.equal(sessionSync.showLocalWarning, false);
});

test('brief disconnection cancels grace and sends buffered edits without local warning', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  sessionSync.open({ id: 'room', status: 'open' }); init({ notes: [] });
  sessionSync.socket.drop(); sessionSync.pushState({ notes: [{ id: 'brief' }] });
  t.mock.timers.tick(1000); init({ notes: [] });
  assert.equal(sessionSync.socket.messages[0].state.notes[0].id, 'brief');
  t.mock.timers.tick(4000);
  assert.equal(sessionSync.showLocalWarning, false); assert.equal(storage.size, 0);
  sessionSync.socket.receive({ type: 'state:ack', version: 1 });
  sessionSync.socket.drop(); t.mock.timers.tick(4999);
  assert.equal(sessionSync.offlineMode, false, 'a new outage gets its own full grace period');
  t.mock.timers.tick(1);
  sessionSync.pushState({ notes: [{ id: 'after-grace' }] });
  assert.equal(storage.size, 1); assert.equal(sessionSync.showLocalWarning, true);
});

test('flush saves the last debounced action and waits for its acknowledgement', async () => {
  sessionSync.open({ id: 'room', status: 'open' });
  init();
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
  init();
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
  init();
  sessionSync.pushState({ notes: ['pending'] });
  const saving = sessionSync.flushPending();
  sessionSync.socket.receive({ type: 'error', message: 'Falha no salvamento' });
  await assert.rejects(saving, /Falha no salvamento/);
  assert.deepEqual(sessionSync.pendingState.notes, ['pending']);
  sessionSync.close();
});

test('offline edits survive reconnection and merge independent remote notes without duplicates', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  sessionSync.open({ id: 'room', status: 'open' }, { userId: 1 });
  const base = { notes: [], events: [], agenda: 'Original' };
  init(base, 4);
  sessionSync.socket.drop();
  sessionSync.pushState({ ...base, notes: [{ id: 'local', text: 'Offline' }], events: [{ id: 'event-local' }] }, true);
  t.mock.timers.tick(5000);
  assert.equal(storage.size, 1);
  sessionSync.connect();
  const socket = sessionSync.socket;
  assert.equal(socket.messages.length, 0, 'must wait for initialization');
  init({ ...base, notes: [{ id: 'remote', text: 'Online' }], events: [{ id: 'event-remote' }], agenda: 'Agenda remota' }, 7);
  assert.equal(socket.messages.length, 1);
  const sent = socket.messages[0];
  assert.equal(sent.baseVersion, 7);
  assert.deepEqual(sent.state.notes.map(note => note.id), ['remote', 'local']);
  assert.equal(sent.state.events.length, 2);
  assert.equal(sent.state.agenda, 'Agenda remota');
  assert.equal(storage.size, 1, 'queue retained until ack');
  socket.receive({ type: 'state:ack', version: 8, requestId: sent.requestId });
  assert.equal(storage.size, 0);
  assert.equal(sessionSync.status, 'connected');
});

test('lost acknowledgement is reconciled against the saved server state without resending events', () => {
  sessionSync.open({ id: 'room', status: 'open' }); init({ notes: [], events: [] }, 1);
  const local = { notes: [{ id: 'n1' }], events: [{ id: 'e1' }] };
  sessionSync.pushState(local, true);
  sessionSync.socket.drop();
  assert.deepEqual(sessionSync.pendingState, local);
  sessionSync.connect(); init(local, 2);
  assert.equal(sessionSync.socket.messages.length, 0);
  assert.equal(sessionSync.dirty, false);
  assert.equal(storage.size, 0);
});

test('queue restores when returning to the room and is isolated by room and user', () => {
  sessionSync.open({ id: 'r1', status: 'open' }, { userId: 1 }); init({ notes: [] });
  sessionSync.socket.drop(); sessionSync.pushState({ notes: [{ id: 'offline' }] }); sessionSync.close();
  sessionSync.open({ id: 'r2', status: 'open' }, { userId: 1 }); assert.equal(sessionSync.dirty, false);
  sessionSync.open({ id: 'r1', status: 'open' }, { userId: 2 }); assert.equal(sessionSync.dirty, false);
  sessionSync.open({ id: 'r1', status: 'open' }, { userId: 1 });
  assert.equal(applied.notes[0].id, 'offline');
  init({ notes: [] });
  assert.equal(sessionSync.socket.messages[0].state.notes[0].id, 'offline');
});

test('conflicting edits wait for a choice and retain unrelated changes from both sides', () => {
  sessionSync.open({ id: 'room', status: 'open' });
  init({ notes: [{ id: 'n1', text: 'Original' }], agenda: 'Original', presence: {} }, 1);
  sessionSync.socket.drop();
  sessionSync.pushState({ notes: [{ id: 'n1', text: 'Local' }], agenda: 'Local', presence: {} });
  sessionSync.connect();
  init({ notes: [{ id: 'n1', text: 'Remoto' }], agenda: 'Original', presence: { Brasil: 'presente' } }, 2);
  assert.equal(sessionSync.status, 'conflict');
  assert.equal(sessionSync.socket.messages.length, 0);
  assert.equal(sessionSync.conflict.conflicts[0].path, 'notes.n1.text');
  sessionSync.resolveConflict('remote');
  const state = sessionSync.socket.messages[0].state;
  assert.equal(state.notes[0].text, 'Remoto');
  assert.equal(state.agenda, 'Local');
  assert.equal(state.presence.Brasil, 'presente');
});

test('closed rooms retain the offline backup and send nothing until reopened', () => {
  sessionSync.open({ id: 'room', status: 'open' }); init({ notes: [] });
  sessionSync.socket.drop(); sessionSync.pushState({ notes: [{ id: 'offline' }] });
  sessionSync.connect(); init({ notes: [] }, 2, 'closed');
  assert.equal(storage.size, 1); assert.equal(sessionSync.socket.messages.length, 0);
  sessionSync.socket.receive({ type: 'room:reopened', state: { notes: [] }, version: 3 });
  assert.equal(sessionSync.socket.messages[0].state.notes[0].id, 'offline');
});

test('late callbacks from an old socket cannot change the newly opened room', () => {
  sessionSync.open({ id: 'r1', status: 'open' }); init({ agenda: 'one' }); const old = sessionSync.socket;
  sessionSync.open({ id: 'r2', status: 'open' }); init({ agenda: 'two' });
  old.receive({ type: 'state:update', state: { agenda: 'wrong' }, version: 9 }); old.drop();
  assert.equal(applied.agenda, 'two'); assert.equal(sessionSync.status, 'connected');
});

test('deletion versus editing conflicts; independent deletion is preserved', () => {
  const base = { notes: [{ id: 'n1', text: 'original' }, { id: 'n2', text: 'same' }] };
  const local = { notes: [base.notes[1]] };
  const remote = { notes: [{ id: 'n1', text: 'changed' }, base.notes[1], { id: 'n3' }] };
  assert.equal(mergeSession(base, local, remote).conflicts.length, 1);
  assert.deepEqual(mergeSession(base, local, remote, 'local').state.notes.map(note => note.id), ['n2', 'n3']);
});

test('reconnect is automatically scheduled and intentional close cancels it', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  sessionSync.open({ id: 'room', status: 'open' }); init({ notes: [] });
  const old = sessionSync.socket; old.drop();
  t.mock.timers.tick(1000);
  assert.ok(sessionSync.socket && sessionSync.socket !== old);
  sessionSync.close(); t.mock.timers.tick(60000); assert.equal(sessionSync.socket, null);
});

test('simultaneous speech totals use event IDs to count both completions only once', () => {
  const base = { events: [], speeches: { Brasil: 0 }, speakTime: { Brasil: 0 } };
  const event = id => ({ id, type: 'speech.finished', details: { mode: 'gsl', participant: 'Brasil', seconds: 30 } });
  const local = { events: [event('local')], speeches: { Brasil: 1 }, speakTime: { Brasil: 30 } };
  const remote = { events: [event('remote')], speeches: { Brasil: 1 }, speakTime: { Brasil: 30 } };
  const result = mergeSession(base, local, remote);
  assert.equal(result.state.speeches.Brasil, 2); assert.equal(result.state.speakTime.Brasil, 60);
  assert.equal(result.conflicts.length, 0);
  assert.equal(mergeSession(base, local, local).state.speeches.Brasil, 1);
});

test('send failures and ack timeouts preserve the outbox', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  sessionSync.open({ id: 'room', status: 'open' }); init({ notes: [] });
  sessionSync.socket.send = () => { throw new Error('network'); };
  sessionSync.pushState({ notes: [{ id: 'n1' }] }, true);
  assert.equal(sessionSync.dirty, true); assert.equal(sessionSync.status, 'disconnected');
  t.mock.timers.tick(1000); init({ notes: [] });
  assert.equal(sessionSync.sending, true);
  t.mock.timers.tick(10000);
  assert.equal(storage.size, 0, 'ack timeout starts the offline grace period');
  t.mock.timers.tick(5000);
  assert.equal(sessionSync.pendingState.notes[0].id, 'n1'); assert.equal(storage.size, 1);
});

test('stale acknowledgements do not clear a new merged request', () => {
  sessionSync.open({ id: 'room', status: 'open' }); init({ notes: [], agenda: 'A' });
  sessionSync.pushState({ notes: [{ id: 'n1' }], agenda: 'A' }, true);
  const oldId = sessionSync.requestId;
  sessionSync.socket.receive({ type: 'state:update', version: 1, state: { notes: [], agenda: 'B' } });
  const newId = sessionSync.requestId;
  sessionSync.socket.receive({ type: 'state:ack', version: 1, requestId: oldId });
  assert.equal(sessionSync.sending, true); assert.equal(sessionSync.requestId, newId);
  sessionSync.socket.receive({ type: 'state:ack', version: 2, requestId: newId });
  assert.equal(sessionSync.dirty, false);
});
