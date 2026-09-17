import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

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

test('room metadata reaches viewers without attaching socket listeners', () => {
  const events = [];
  const unsubscribe = sessionSync.subscribe(event => { if (event.type === 'room') events.push(event.room); });
  try {
    sessionSync.open({ id: 'room' }, { mode: 'viewer' });
    sessionSync.socket.receive({ type: 'state:init', state: null, version: 0, room: { id: 'room', name: 'Sala nova', status: 'open' } });
    assert.equal(events[0].name, 'Sala nova');
    assert.equal(sessionSync.status, 'connected');
  } finally { unsubscribe(); }
});

test('deleted rooms stop retrying and keep pending data available for download', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  sessionSync.open({ id: 'room', status: 'open' }); init({ notes: [] });
  sessionSync.pushState({ notes: [{ id: 'pending' }] });
  sessionSync.socket.receive({ type: 'room:deleted' });
  sessionSync.socket.drop();
  t.mock.timers.tick(60000);
  assert.equal(sessionSync.socket, null);
  assert.equal(sessionSync.status, 'deleted');
  assert.equal(sessionSync.showRecoveryActions, true);
  assert.equal(sessionSync.localState.notes[0].id, 'pending');
});

test('explicit discard clears only this room recovery data and sends nothing', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  sessionSync.open({ id: 'room', status: 'open' }); init({ notes: [] });
  sessionSync.socket.drop(); sessionSync.pushState({ notes: [{ id: 'pending' }] });
  t.mock.timers.tick(5000);
  storage.set('other-room', 'keep');
  sessionSync.discardPending();
  assert.equal(sessionSync.dirty, false);
  assert.equal(storage.size, 1);
  assert.equal(storage.get('other-room'), 'keep');
});

test('configuration changes preserve the running timer unless its duration changes', () => {
  const source = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
  const fn = source.slice(source.indexOf('function saveConfig(){'), source.indexOf('function openPanel('));
  const fields = Object.fromEntries(Object.entries({ 'c-conf': 'SimSD', 'c-committee': 'UNODC', 'c-session': '1', 'c-time': '60', 'c-warn': '15' }).map(([key, value]) => [key, { value }]));
  fields['c-independent-tabs'] = { checked: true };
  let finished = 0, saved = 0, alerts = 0;
  const ctx = {
    S: { config: { defaultTime: 60 }, activeTab: 'gsl', timer: { total: 60, sec: 37, running: true, iv: 123 } },
    activeRoomId: 'room', localActiveTab: null,
    document: { getElementById: id => fields[id] || (fields[id] = {}) },
    finishActivity() { finished++; }, clearInterval() {}, logEvent() {}, closePanel() {}, updateGslTimer() {},
    save() { saved++; }, alert() { alerts++; },
  };
  runInNewContext(`${fn}\nsaveConfig();`, ctx);
  assert.equal(ctx.S.timer.sec, 37);
  assert.equal(ctx.S.timer.running, true);
  assert.equal(finished, 0);
  assert.equal(ctx.S.config.independentTabs, true);
  fields['c-time'].value = '-10';
  runInNewContext('saveConfig()', ctx);
  assert.equal(alerts, 1); assert.equal(saved, 1); assert.equal(ctx.S.timer.sec, 37);
  fields['c-time'].value = '90';
  runInNewContext('saveConfig()', ctx);
  assert.equal(ctx.S.timer.sec, 90); assert.equal(ctx.S.timer.running, false); assert.equal(finished, 1);
});

test('selected client sends projector tabs on its existing socket without saving session state', t => {
  window.SimSDController.projection = () => ({ tab: 'vote', speechMode: 'gsl' });
  try {
    sessionSync.open({ id: 'room', status: 'open' });
    sessionSync.socket.receive({ type: 'state:init', state: {}, version: 0, room: { status: 'open' }, clientId: 'this-client', projector: null });
    const socket = sessionSync.socket;
    sessionSync.selectProjector(true);
    assert.equal(socket.messages.at(-1).type, 'projector:select');
    socket.receive({ type: 'projector:state', projector: { clientId: 'this-client', tab: 'gsl', speechMode: 'gsl' } });
    sessionSync.publishProjectorTab();
    assert.equal(socket.messages.at(-1).type, 'projector:tab');
    assert.equal(socket.messages.at(-1).tab, 'vote');
    assert.equal(sessionSync.dirty, false);
    assert.equal(storage.size, 0);
    socket.receive({ type: 'projector:state', projector: { clientId: 'other', tab: 'gsl' } });
    const count = socket.messages.length;
    sessionSync.publishProjectorTab();
    assert.equal(socket.messages.length, count);
  } finally { delete window.SimSDController.projection; }
});

test('repeated online actions use one socket immediately with no storage writes or status changes', t => {
  sessionSync.open({ id: 'room', status: 'open' }); init({ notes: [] });
  const socket = sessionSync.socket;
  const writes = t.mock.method(localStorage, 'setItem');
  const deletes = t.mock.method(localStorage, 'removeItem');
  const statuses = [];
  const unsubscribe = sessionSync.subscribe(event => { if (event.type === 'status') statuses.push(event.status); });
  try {
    for (let i = 1; i <= 20; i++) {
      sessionSync.pushState({ notes: [{ id: 'n', text: String(i) }] });
      assert.equal(socket.messages.length, i, 'send synchronously, without a debounce timer');
      sessionSync.connect();
      assert.equal(sessionSync.socket, socket, 'connect must not replace an open socket');
      sessionSync.persist();
      socket.receive({ type: 'state:ack', version: i });
    }
    assert.deepEqual(statuses, []);
    assert.equal(writes.mock.callCount(), 0);
    assert.equal(deletes.mock.callCount(), 0);
  } finally { unsubscribe(); }
});

test('legacy chair save and remote state application never write session data locally', () => {
  const source = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
  const save = source.slice(source.indexOf('function save(){'), source.indexOf('function logEvent('));
  const apply = source.slice(source.indexOf('function applyRemoteState('), source.indexOf('function reportHTMLForState('));
  let writes = 0; let sends = 0;
  const context = {
    readOnly: false, activeRoomId: 'room', applyingRemoteState: false,
    currentTab: () => 'gsl', S: { config: {} }, localActiveTab: null,
    sessionSnapshot: () => ({ notes: [] }), stateStorageKey: () => 'session',
    localStorage: { setItem: () => { writes++; } },
    window: { SimSDSync: { pushState: () => { sends++; }, publishProjectorTab() {} } },
    stopAll() {}, hydrateState() {}, showCurrentState() {},
  };
  runInNewContext(`${save}\n${apply}\nsave(); applyRemoteState({notes: []});`, context);
  assert.equal(sends, 1); assert.equal(writes, 0);
  context.activeRoomId = null;
  runInNewContext(`${save}\nsave();`, context);
  assert.equal(writes, 1, 'visitor mode still stores its standalone state');
});

test('independent tabs stay local across shared edits and resume synchronization when disabled', () => {
  const source = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
  const current = source.match(/function currentTab\(\)\{[^\n]+/)[0];
  const tabs = source.slice(source.indexOf('function switchTab('), source.indexOf('let editingNote ='));
  const apply = source.slice(source.indexOf('function applyRemoteState('), source.indexOf('function reportHTMLForState('));
  function client() {
    const nodes = new Map();
    const ctx = {
      S: { config: { independentTabs: true }, activeTab: 'gsl', speechMode: 'gsl', notes: [] },
      activeRoomId: 'room', localActiveTab: null, readOnly: false, applyingRemoteState: false,
      window: {},
      saves: 0, save() { ctx.saves++; },
      document: {
        querySelectorAll: () => [],
        getElementById: id => {
          if (!nodes.has(id)) nodes.set(id, { style: {}, classList: { add() {} } });
          return nodes.get(id);
        },
      },
      stopAll() {}, hydrateState(state) { ctx.S = structuredClone(state); },
      showCurrentState() { runInNewContext('switchTab(currentTab())', ctx); },
      populateNoteSelects() {}, renderNotes() {}, renderNoteTarget() {}, renderPresence() {},
      renderVote() {}, updateModDisplay() {}, renderModList() {}, renderSpeakers() {}, renderRP() {},
    };
    runInNewContext(`${current}\n${tabs}\n${apply}`, ctx);
    return ctx;
  }
  const first = client(), second = client();
  runInNewContext("switchTab('notes')", first);
  runInNewContext("switchTab('vote')", second);
  assert.equal(first.saves + second.saves, 0);
  assert.equal(first.S.activeTab, 'gsl');
  assert.equal(second.S.activeTab, 'gsl');
  first.S.notes.push({ id: 'shared', text: 'Nota compartilhada' });
  second.remote = structuredClone(first.S);
  runInNewContext('applyRemoteState(remote)', second);
  assert.equal(runInNewContext('currentTab()', first), 'notes');
  assert.equal(runInNewContext('currentTab()', second), 'vote');
  assert.equal(second.S.notes[0].text, 'Nota compartilhada');
  assert.equal(second.S.speechMode, 'gsl');
  second.remote = { ...second.remote, config: { independentTabs: false }, activeTab: 'presence' };
  runInNewContext('applyRemoteState(remote)', second);
  assert.equal(runInNewContext('currentTab()', second), 'presence');
  runInNewContext("switchTab('notes')", second);
  assert.equal(second.S.activeTab, 'notes');
  assert.equal(second.saves, 1);
});

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
  assert.equal(sessionSync.showLocalWarning, false, 'restored connection uses the direct channel');
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

test('flush waits for the acknowledgement of the directly sent action', async () => {
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

test('queue restores when returning to the room and is isolated by room and user', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  sessionSync.open({ id: 'r1', status: 'open' }, { userId: 1 }); init({ notes: [] });
  sessionSync.socket.drop(); sessionSync.pushState({ notes: [{ id: 'offline' }] }); t.mock.timers.tick(5000); sessionSync.close();
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

test('closed rooms retain the offline backup and send nothing until reopened', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  sessionSync.open({ id: 'room', status: 'open' }); init({ notes: [] });
  sessionSync.socket.drop(); sessionSync.pushState({ notes: [{ id: 'offline' }] });
  t.mock.timers.tick(5000);
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

test('ack delays do not close a healthy socket; real drops start the grace period', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  sessionSync.open({ id: 'room', status: 'open' }); init({ notes: [] });
  sessionSync.socket.send = () => { throw new Error('network'); };
  sessionSync.pushState({ notes: [{ id: 'n1' }] }, true);
  assert.equal(sessionSync.dirty, true); assert.equal(sessionSync.status, 'disconnected');
  t.mock.timers.tick(1000); init({ notes: [] });
  assert.equal(sessionSync.sending, true);
  const socket = sessionSync.socket;
  t.mock.timers.tick(10000);
  assert.equal(storage.size, 0);
  assert.equal(sessionSync.socket, socket);
  assert.equal(socket.readyState, WebSocket.OPEN);
  assert.equal(sessionSync.status, 'connected');
  socket.drop();
  t.mock.timers.tick(4999);
  assert.equal(storage.size, 0);
  t.mock.timers.tick(1);
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

test('lost acknowledgement recovers over the same socket without replaying committed changes', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  sessionSync.open({ id: 'room', status: 'open' }); init({ notes: [] });
  const socket = sessionSync.socket;
  const state = { notes: [{ id: 'committed' }] };
  sessionSync.pushState(state);
  t.mock.timers.tick(10000);
  const probe = socket.messages.at(-1);
  assert.equal(probe.type, 'state:request');
  socket.receive({ type: 'state:snapshot', state, version: 1, status: 'open', requestId: probe.requestId });
  assert.equal(sessionSync.dirty, false);
  assert.equal(sessionSync.socket, socket);
  assert.equal(storage.size, 0);
  assert.equal(socket.messages.filter(message => message.type === 'state:update').length, 1);
});

test('viewer remains read-only after a room is reopened', t => {
  const readOnly = t.mock.method(window.SimSDController, 'setReadOnly');
  sessionSync.open({ id: 'room', status: 'closed' }, { mode: 'viewer' });
  init({ notes: [] }, 1, 'closed');
  sessionSync.socket.receive({ type: 'room:reopened', state: { notes: [] }, version: 2 });
  assert.equal(readOnly.mock.calls.at(-1).arguments[0], true);
  sessionSync.pushState({ notes: [{ id: 'forbidden' }] });
  assert.equal(sessionSync.socket.messages.length, 0);
});

test('snapshot acknowledgement does not conflict with newer edits to the same note', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  sessionSync.open({ id: 'room', status: 'open' }); init({ notes: [{ id: 'n', text: 'A' }] });
  const accepted = { notes: [{ id: 'n', text: 'B' }] };
  sessionSync.pushState(accepted);
  sessionSync.pushState({ notes: [{ id: 'n', text: 'C' }] });
  t.mock.timers.tick(10000);
  const socket = sessionSync.socket;
  socket.receive({ type: 'state:snapshot', state: accepted, version: 1, status: 'open', requestId: sessionSync.requestId });
  assert.equal(sessionSync.conflict, null);
  assert.equal(socket.messages.at(-1).state.notes[0].text, 'C');
  assert.equal(socket.messages.at(-1).baseVersion, 1);
  socket.receive({ type: 'state:ack', version: 2, requestId: sessionSync.requestId });
  assert.equal(sessionSync.dirty, false);
  assert.equal(storage.size, 0);
});
