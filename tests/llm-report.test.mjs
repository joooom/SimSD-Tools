import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLlmReport } from '../server/llmReport.js';
import { appendSessionEvent, finishSessionActivities } from '../src/sessionEvents.js';

const roomFor = state => ({ id: 'r1', code: 'TEST', name: 'Sala', status: 'open', session_state: JSON.stringify(state) });

test('XML keeps session first, escapes user content and sorts dated events without guessing legacy dates', () => {
  const state = {
    config: { committee: 'Comitê & <Teste>' },
    events: [
      { id: 'late', type: 'debate.finished', at: '2026-09-16T00:01:00Z', details: { mode: 'unmod' } },
      { id: 'early', type: 'speech.finished', at: '2026-09-15T23:59:00Z', details: { participant: 'Brasil' } },
    ],
    notes: [{ id: 'n1', type: 'general', text: '<instruction>"&\u0000</instruction>', createdAt: '2026-09-16T00:02:00Z' }],
    history: [{ eventId: 'early', c: 'Brasil' }, { c: 'França', t: '23:58:00' }],
    voteHistory: [{ label: 'Documento', detail: [{ c: 'Brasil', v: 'fav' }], t: '00:03:00' }],
  };
  const xml = buildLlmReport(roomFor(state));
  assert.ok(xml.indexOf('<session_data>') < xml.indexOf('<notes '));
  assert.ok(xml.indexOf('id="early"') < xml.indexOf('id="late"'));
  assert.match(xml, /Comitê &amp; &lt;Teste&gt;/);
  assert.match(xml, /&lt;instruction&gt;&quot;&amp;&lt;\/instruction&gt;/);
  assert.ok(!xml.includes('\u0000'));
  assert.match(xml, /undated_legacy_records count="2"/);
  assert.equal((xml.match(/type="speech.legacy"/g) || []).length, 1);
  assert.match(xml, /não são transcrições/);
});

test('events snapshot mutable data and retain more than historical caps', () => {
  const state = {};
  const details = { tally: { fav: 1 } };
  for (let i = 0; i < 150; i++) appendSessionEvent(state, 'vote.recorded', details);
  details.tally.fav = 99;
  assert.equal(state.events.length, 150);
  assert.equal(state.events[0].details.tally.fav, 1);
  assert.equal(new Set(state.events.map(e => e.id)).size, 150);
  assert.equal(state.eventLogStartedAt, state.events[0].at);
});

test('closing ends all active speech and debate modes with consumed clock time', () => {
  const state = { eventActivities: {}, timer: { sec: 20 }, mod: { spkSec: 10, totalSec: 500 }, unmod: { sec: 250 }, solo: { sec: 15 } };
  for (const [key, kind, mode, initialSeconds] of [['gsl','speech','gsl',60],['mod','speech','mod',60],['mod-debate','debate','mod',600],['unmod','debate','unmod',300],['solo','speech','solo',60]]) {
    state.eventActivities[key] = { id: key, kind, mode, initialSeconds, participant: kind === 'speech' ? 'Brasil' : null };
  }
  finishSessionActivities(state, 'session_closed');
  assert.deepEqual(state.events.map(e => e.details.seconds), [40, 50, 100, 50, 45]);
  assert.deepEqual(state.eventActivities, {});
  finishSessionActivities(state, 'session_closed');
  assert.equal(state.events.length, 5);
});

test('empty and legacy sessions remain exportable', () => {
  assert.match(buildLlmReport(roomFor(null)), /notes count="0"/);
  assert.match(buildLlmReport(roomFor({ notes: [{ id: 'n', text: 'Sem data' }] })), /undated_legacy_records count="1"/);
});
