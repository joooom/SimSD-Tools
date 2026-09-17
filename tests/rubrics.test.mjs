import test from 'node:test';
import assert from 'node:assert/strict';
import { consolidateRubrics, rubricOptions, applyFinalAssessments } from '../server/rubrics.js';
import { scoreConcept, scoreStars, rubricLabel, DPO_QUESTIONS } from '../src/rubricConfig.js';
import { buildRubricDocx } from '../server/rubricDocx.js';
import JSZip from 'jszip';

const sessions = [{ id: 's1', committeeKey: 'unesco', roomName: 'Sessão escolhida' }, { id: 's2', committeeKey: 'unesco' }];
const selection = { committeeKeys: ['unesco'], roomIds: ['s1'], priority: 'latest', includeGeneral: false, includeUnassessed: false };
const note = (id, date, ratings, extra = {}) => ({ id, createdAt: date, ratings, source: 'session', committeeKey: 'unesco', participant: 'Brasil', session: { roomId: 's1' }, text: 'Registro de teste', ...extra });
const records = [
  note('old', '2026-09-14T12:00:00Z', { diplomacy: 5, topicKnowledge: 4, dpoStructure: 3 }, { updatedAt: '2026-09-18T12:00:00Z' }),
  note('middle', '2026-09-15T12:00:00Z', { diplomacy: 1, topicKnowledge: null }),
  note('new', '2026-09-16T12:00:00Z', { diplomacy: 3, dpoStructure: 5 }),
  note('excluded', '2026-09-17T12:00:00Z', { diplomacy: 4 }, { session: { roomId: 's2' } }),
  note('outside', '2026-09-18T12:00:00Z', { diplomacy: 2 }, { source: 'general', session: null }),
];
const delegate = (priority, includeGeneral = false) => consolidateRubrics(records, { ...selection, priority, includeGeneral }, sessions).comites[0].delegacoes[0];

test('priorities consolidate each criterion independently, ignore nulls and unselected sessions', () => {
  assert.equal(delegate('highest').ratings.diplomacy, 5);
  assert.equal(delegate('lowest').ratings.diplomacy, 1);
  assert.equal(delegate('latest').ratings.diplomacy, 3);
  assert.equal(delegate('latest', true).ratings.diplomacy, 2);
  assert.equal(delegate('latest').ratings.topicKnowledge, 4);
  assert.equal(delegate('latest').criterios_gerais.dominio_tema, 4);
  assert.equal(delegate('latest').criterios_gerais.cooperacao_diplomacia, 3);
  assert.equal(delegate('latest').ratings.decorum, null);
  assert.equal(delegate('latest').evidence.diplomacy.noteId, 'new');
  assert.equal(delegate('latest').evidence.diplomacy.candidates, 3);
  assert.equal(delegate('lowest').dpo_formatacao, 'C');
  assert.equal(delegate('highest').dpo_formatacao, 'A');
});

test('ties are deterministic and missing dates rank before dated entries', () => {
  const tied = [note('b', '2026-09-16T12:00:00Z', { diplomacy: 4 }), note('a', '2026-09-16T12:00:00Z', { diplomacy: 4 }), note('unknown', null, { diplomacy: 5 })];
  const first = consolidateRubrics(tied, selection, sessions);
  const second = consolidateRubrics([...tied].reverse(), selection, sessions);
  assert.equal(first.comites[0].delegacoes[0].evidence.diplomacy.noteId, 'a');
  assert.equal(first.fingerprint, second.fingerprint);
});

test('strict session selection, no implicit all-sessions, and opt-in empty delegations', () => {
  assert.throws(() => rubricOptions({ ...selection, roomIds: [] }, sessions));
  assert.throws(() => rubricOptions({ ...selection, roomIds: ['missing'] }, sessions));
  assert.throws(() => rubricOptions({ ...selection, committeeKeys: ['oea'] }, sessions));
  assert.throws(() => rubricOptions({ ...selection, priority: 'random' }, sessions));
  assert.equal(consolidateRubrics([], selection).delegationCount, 0);
  assert.equal(consolidateRubrics([], { ...selection, includeUnassessed: true }).delegationCount, 30);
  assert.deepEqual(rubricOptions({ ...selection, roomIds: [], includeGeneral: true }, sessions).roomIds, []);
});

test('grade mapping matches user scale and leaves missing data unassessed', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(scoreConcept), ['D', 'D', 'C', 'B', 'A']);
  assert.deepEqual([1, 2, 3, 4, 5].map(scoreStars), ['☆', '☆☆', '☆☆☆', '☆☆☆☆', '☆☆☆☆☆']);
  assert.equal(scoreConcept(null), '');
  assert.equal(scoreStars(null), 'Não avaliado');
  assert.equal(rubricLabel({ id: 'dpoBillPosition' }, 'unesco'), DPO_QUESTIONS.unesco[2]);
});

test('fingerprint changes after score changes and final assessments are validated', () => {
  const report = consolidateRubrics(records, selection, sessions);
  const changed = consolidateRubrics([...records, note('latest', '2026-09-19T00:00:00Z', { diplomacy: 1 })], selection, sessions);
  assert.notEqual(report.fingerprint, changed.fingerprint);
  const final = applyFinalAssessments(report, { 'unesco:Brasil': ' Bom desempenho ' });
  assert.equal(final.comites[0].delegacoes[0].avaliacao_final, 'Bom desempenho');
  assert.equal(report.comites[0].delegacoes[0].avaliacao_final, '');
  assert.throws(() => applyFinalAssessments(report, { 'oea:Brasil': 'Fora da seleção' }));
  assert.throws(() => applyFinalAssessments(report, { 'unesco:Brasil': 'x'.repeat(501) }));
});

test('DOCX includes committee questions, five-star scale and manual final assessment', async () => {
  const report = applyFinalAssessments(consolidateRubrics(records, { ...selection, priority: 'highest' }, sessions), { 'unesco:Brasil': 'Análise & revisão' });
  const buffer = await buildRubricDocx(report);
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file('word/document.xml').async('string');
  assert.match(xml, /RUBRICA DE AVALIAÇÃO DAS DELEGAÇÕES/);
  assert.match(xml, /Inteligências artificiais/);
  assert.match(xml, /Análise &amp; revisão/);
  assert.match(xml, /Não avaliado/);
  assert.equal((xml.match(/<w:tbl>/g) || []).length, 3);
  assert.match(xml, /☆☆☆☆☆/);
  assert.doesNotMatch(xml, /☆☆☆☆☆☆/);
  assert.doesNotMatch(xml, /PLP 152/);
});
