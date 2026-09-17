import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLlmReport } from '../server/llmReport.js';
import { appendSessionEvent, finishSessionActivities } from '../src/sessionEvents.js';
import { generalNotesReport, generalNotesXml } from '../server/generalNotesReport.js';
import { EVALUATION_CRITERIA, validateRatings } from '../server/evaluationCriteria.js';
import { EVALUATION_CRITERIA as clientCriteria } from '../src/evaluationCriteria.js';

test('DPO subcriteria preserve old evaluations and validate each optional score', () => {
  assert.deepEqual(clientCriteria, EVALUATION_CRITERIA);
  const children = EVALUATION_CRITERIA.filter(criterion => criterion.parentId === 'dpo');
  assert.equal(children.length, 5);
  const legacy = validateRatings({ dpo: 4 });
  assert.equal(legacy.dpo, 4);
  for (const { id } of children) {
    assert.equal(legacy[id], null);
    assert.equal(validateRatings({ [id]: 5 })[id], 5);
    for (const invalid of [0, 6, 1.5, '3']) assert.throws(() => validateRatings({ [id]: invalid }));
  }
});

const roomFor = state => ({ id: 'r1', code: 'TEST', name: 'Sala', status: 'open', session_state: JSON.stringify(state) });

test('general export applies all filters to nested notes, events and legacy records', () => {
  const notes = [
    { id: 'n1', participant: 'Brasil', text: '<exemplo>', createdAt: '2026-09-16T03:00:00Z' },
    { id: 'n2', participant: 'Brasil', text: 'OUTRO_DIA', createdAt: '2026-09-16T02:59:59Z' },
    { id: 'n3', participant: 'França', text: 'OUTRA_DELEGACAO', createdAt: '2026-09-16T03:00:00Z' },
  ];
  const state = { committeeKey: 'unesco', notes, events: [
    { id: 'e1', type: 'speech.finished', at: notes[0].createdAt, details: { participant: 'Brasil', text: '<exemplo>' } },
    { id: 'e2', type: 'speech.finished', at: notes[1].createdAt, details: { participant: 'Brasil', text: 'OUTRO_DIA' } },
    { id: 'e3', type: 'speech.finished', at: notes[0].createdAt, details: { participant: 'França', text: 'OUTRA_DELEGACAO' } },
    { id: 'e4', type: 'note.added', at: notes[0].createdAt, details: { noteId: 'n3' } },
  ], history: [{ c: 'Brasil', t: '12:00', text: 'SEM_DATA' }], speeches: { Brasil: 99 } };
  const rooms = [roomFor(state), { ...roomFor(state), id: 'unmatched' }];
  const publicNotes = notes.map(note => ({ ...note, source: 'session', committeeKey: 'unesco', session: { roomId: 'r1' }, canEdit: true }));
  const report = generalNotesReport(publicNotes, { roomId: 'r1', committeeKey: 'unesco', delegation: 'Brasil', day: '2026-09-16', search: 'exemplo' }, rooms);
  assert.equal(report.sessions.length, 1);
  assert.equal(report.notes.length, 1);
  assert.equal(report.notes[0].canEdit, undefined);
  assert.deepEqual(report.sessions[0].state.notes.map(note => note.id), ['n1']);
  assert.deepEqual(report.sessions[0].state.events.map(event => event.id), ['e1']);
  assert.equal(report.sessions[0].state.speeches, undefined);
  const xml = generalNotesXml(report);
  assert.equal((xml.match(/<llm_evaluation_report /g) || []).length, 1);
  assert.match(xml, /type="speech.finished"/);
  assert.match(xml, /&lt;exemplo&gt;/);
  for (const excluded of ['OUTRO_DIA', 'OUTRA_DELEGACAO', 'SEM_DATA', 'unmatched']) assert.ok(!xml.includes(excluded), excluded);
  assert.match(generalNotesXml(generalNotesReport(publicNotes, { roomId: 'missing' }, rooms)), /<sessions count="0">/);
  assert.equal(generalNotesReport(publicNotes, { source: 'general' }, rooms).sessions.length, 0);
  assert.equal(generalNotesReport(publicNotes, { roomId: 'r1' }, rooms).sessions[0].state.notes.length, 3);
  const eventOnly = generalNotesReport(publicNotes, { roomId: 'r1', search: 'speech.finished' }, rooms);
  assert.equal(eventOnly.notes.length, 0);
  assert.equal(eventOnly.sessions[0].state.events.length, 3);
  assert.equal(eventOnly.sessions[0].state.notes.length, 0);
});

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
