import test from 'node:test';
import assert from 'node:assert/strict';
import { startCountdown, stopCountdown, projectedState } from '../src/countdown.js';
import { statePatch, applyStatePatch } from '../server/sessionPatch.js';
import { viewerState, sendViewerState } from '../server/viewerDelivery.js';

test('a stalled chair catches up once using elapsed time and checkpoints every five seconds', t => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  let elapsed = 0;
  const clock = { sec: 60 }, ticks = [];
  clock.iv = startCountdown(clock, (values, checkpoint) => ticks.push({ ...values, checkpoint }), () => elapsed, () => 100000);
  assert.equal(clock.playback.deadlines.sec, 160000);
  elapsed = 1000; t.mock.timers.tick(1000);
  assert.deepEqual(ticks, [{ sec: 59, checkpoint: false }]);
  elapsed = 9000; t.mock.timers.tick(1000);
  assert.deepEqual(ticks.at(-1), { sec: 51, checkpoint: true });
  t.mock.timers.tick(1000); assert.equal(ticks.length, 2, 'no replay of queued callbacks');
  stopCountdown(clock);
  elapsed = 12000; t.mock.timers.tick(3000); assert.equal(ticks.length, 2);
  assert.deepEqual(clock.playback, { running: false });
});

test('moderated debate stops consuming total time when its speaker expires during a stall', t => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  let elapsed = 0, result;
  const clock = { spkSec: 10, totalSec: 900 };
  clock.iv = startCountdown(clock, values => { result = values; }, () => elapsed, () => 100000);
  elapsed = 30000; t.mock.timers.tick(1000);
  assert.deepEqual(result, { spkSec: 0, totalSec: 890 });
  assert.equal(projectedState({ mod: clock }, 130000).mod.totalSec, 890);
  stopCountdown(clock);
});

test('delayed snapshots all display the current deadline instead of accelerating through old seconds', () => {
  const visible = [];
  for (const sec of [60, 59, 58, 57, 56, 55]) {
    const state = { timer: { sec, playback: { running: true, deadlines: { sec: 160000 } } } };
    visible.push(projectedState(state, 105000).timer.sec);
    assert.equal(state.timer.sec, sec, 'projection must not mutate shared state');
  }
  assert.deepEqual(visible, [55, 55, 55, 55, 55, 55]);
  const paused = { timer: { sec: 42, playback: { running: false } } };
  assert.equal(projectedState(paused, 200000), paused);
  const legacy = { timer: { sec: 42 } };
  assert.equal(projectedState(legacy, 200000), legacy);
});

test('all four projected clocks reach zero without going negative or invoking session actions', () => {
  const clock = { sec: 60, playback: { running: true, deadlines: { sec: 160000 } } };
  const state = { timer: clock, solo: clock, unmod: clock, mod: { spkSec: 60, totalSec: 60, playback: { running: true, deadlines: { spkSec: 160000, totalSec: 160000 } } } };
  const projected = projectedState(state, 200000);
  for (const key of ['timer', 'solo', 'unmod']) assert.equal(projected[key].sec, 0);
  assert.equal(projected.mod.spkSec, 0); assert.equal(projected.mod.totalSec, 0);
});

test('timer patches and viewer payloads exclude a large unchanged note/event history', () => {
  const before = { timer: { sec: 60 }, notes: [{ id: 'n', text: 'n'.repeat(100000) }], events: [{ id: 'e', text: 'e'.repeat(100000) }], agenda: 'Agenda' };
  const after = { ...before, timer: { sec: 55 } };
  const patch = statePatch(before, after);
  assert.deepEqual(applyStatePatch(before, patch), after);
  assert.ok(JSON.stringify(patch).length < 100);
  assert.ok(JSON.stringify(viewerState(after)).length < 100);
  assert.equal(before.timer.sec, 60);
  const removed = { timer: after.timer };
  assert.deepEqual(applyStatePatch(after, statePatch(after, removed)), removed);
});

test('malformed patches cannot modify prototypes or use invalid deletion keys', () => {
  for (const patch of [null, { set: [], remove: [] }, { set: {}, remove: [42] }, { set: {}, remove: ['constructor'] }, JSON.parse('{"set":{"__proto__":{"polluted":true}},"remove":[]}')]) {
    assert.throws(() => applyStatePatch({}, patch));
  }
  assert.equal({}.polluted, undefined);
});

test('a slow viewer queues only the latest state and reconnects if its write stalls', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sent = [], callbacks = [];
  let terminated = false;
  const socket = { readyState: 1, send(message, cb) { sent.push(JSON.parse(message)); callbacks.push(cb); }, terminate() { terminated = true; this.readyState = 3; } };
  for (let version = 1; version <= 100; version++) sendViewerState(socket, { type: 'state:update', version, state: { timer: { sec: 100 - version }, notes: [{ text: 'private' }] } });
  assert.equal(sent.length, 1);
  assert.equal(JSON.parse(socket.viewerPending).version, 100);
  callbacks.shift()();
  assert.deepEqual(sent.map(message => message.version), [1, 100]);
  assert.equal(sent[1].state.notes, undefined);
  t.mock.timers.tick(10000);
  assert.equal(terminated, true);
});
