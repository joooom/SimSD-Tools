import test from 'node:test';
import assert from 'node:assert/strict';
import { createNavigation, parseRoute, restoredRoomTab } from '../src/navigation.js';

test('restoring old URLs respects shared tabs, independent tabs and closed rooms', () => {
  assert.equal(restoredRoomTab('notes', 'presence'), 'presence');
  assert.equal(restoredRoomTab('notes', 'presence', { independentTabs: true }), 'notes');
  assert.equal(restoredRoomTab('notes', 'presence', { closed: true }), 'notes');
  assert.equal(restoredRoomTab(null, 'presence', { independentTabs: true }), 'presence');
});

function browserAt(hash = '') {
  const listeners = new Map();
  const entries = [{ hash, state: null }];
  let position = 0;
  const browser = {
    location: { hash },
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: name => listeners.delete(name),
    history: {
      get state() { return entries[position].state; },
      replaceState(state, _, hash) { entries[position] = { state, hash }; browser.location.hash = hash; },
      pushState(state, _, hash) { entries.splice(++position, entries.length, { state, hash }); browser.location.hash = hash; },
      async go(delta) {
        position += delta;
        browser.location.hash = entries[position].hash;
        await listeners.get('popstate')?.();
      },
    },
    entries,
  };
  return browser;
}

test('refresh restores room, tab and admin section from the URL', () => {
  const browser = browserAt('#/sala/room-123/notes');
  const navigation = createNavigation(browser);
  assert.deepEqual(parseRoute(navigation.getSnapshot()), { page: 'room', roomId: 'room-123', tab: 'notes' });
  assert.deepEqual(parseRoute('#/admin/pendencias'), { page: 'admin', section: 'import' });
  assert.deepEqual(parseRoute('#/admin/ajuda/ticket-123'), { page: 'admin', section: 'help', ticketId: 'ticket-123' });
  assert.equal(parseRoute('#/sala/room-123/bogus').tab, null);
  assert.equal(parseRoute('#/sala/../../').page, 'rooms');
});

test('back and forward traverse screens; remote tab updates replace the current entry', async () => {
  const browser = browserAt();
  const navigation = createNavigation(browser);
  await navigation.navigate('#/notas');
  await navigation.navigate('#/sala/123/notes');
  await navigation.navigate('#/sala/123/presence', { replace: true });
  assert.equal(browser.entries.length, 3);
  await browser.history.go(-1);
  assert.equal(navigation.getSnapshot(), '#/notas');
  await browser.history.go(1);
  assert.equal(navigation.getSnapshot(), '#/sala/123/presence');
  await navigation.navigate('#/sala/123/presence');
  assert.equal(browser.entries.length, 3);
});

test('failed pending-save guard keeps the room and restores browser history', async () => {
  const browser = browserAt('#/salas');
  const navigation = createNavigation(browser);
  await navigation.navigate('#/sala/123/notes');
  let saved = false;
  navigation.setGuard(async next => next.page === 'room' || saved);
  assert.equal(await navigation.navigate('#/admin/salas'), false);
  await browser.history.go(-1);
  assert.equal(browser.location.hash, '#/sala/123/notes');
  assert.equal(navigation.getSnapshot(), '#/sala/123/notes');
  saved = true;
  await browser.history.go(-1);
  assert.equal(navigation.getSnapshot(), '#/salas');
});

test('a stale asynchronous navigation cannot override a newer destination', async () => {
  const browser = browserAt();
  const navigation = createNavigation(browser);
  let finish;
  navigation.setGuard(next => next.page === 'notes' ? new Promise(resolve => { finish = resolve; }) : true);
  const first = navigation.navigate('#/notas');
  await navigation.navigate('#/rubricas');
  finish(true);
  assert.equal(await first, false);
  assert.equal(navigation.getSnapshot(), '#/rubricas');
});

test('remote tab updates cannot cancel an exit waiting for a save', async () => {
  const browser = browserAt('#/sala/123/notes');
  const navigation = createNavigation(browser);
  let finish;
  navigation.setGuard(next => next.page === 'rooms' ? new Promise(resolve => { finish = resolve; }) : true);
  const leaving = navigation.navigate('#/salas');
  assert.equal(await navigation.navigate('#/sala/123/gsl', { replace: true, passive: true }), false);
  finish(true);
  assert.equal(await leaving, true);
  assert.equal(navigation.getSnapshot(), '#/salas');
});
