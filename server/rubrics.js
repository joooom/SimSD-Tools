import { createHash } from 'node:crypto';
import { COMMITTEE_NAMES, EVALUATION_CRITERIA, committeeDelegations } from './evaluationCriteria.js';
import { DPO_QUESTION_IDS, GENERAL_RUBRIC_KEYS, PRIORITY_LABELS, rubricKey, scoreConcept, scoreLevel } from './rubricConfig.js';

const invalid = message => Object.assign(new Error(message), { status: 400 });
export function rubricOptions(body, sessions) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('Seleção inválida.');
  const { committeeKeys, roomIds, priority = 'latest', includeGeneral = false, includeUnassessed = false } = body;
  if (!Array.isArray(committeeKeys) || !committeeKeys.length || committeeKeys.length > 4 || committeeKeys.some(key => !Object.hasOwn(COMMITTEE_NAMES, key))) throw invalid('Selecione ao menos um comitê válido.');
  if (!Array.isArray(roomIds) || roomIds.length > 500 || roomIds.some(id => typeof id !== 'string' || !sessions.some(session => session.id === id && committeeKeys.includes(session.committeeKey)))) throw invalid('Uma sessão selecionada não está disponível no comitê. Atualize as opções.');
  if (typeof includeGeneral !== 'boolean' || typeof includeUnassessed !== 'boolean') throw invalid('Opções inválidas.');
  if (!roomIds.length && !includeGeneral) throw invalid('Selecione sessões ou inclua notas fora de sessão.');
  if (!Object.hasOwn(PRIORITY_LABELS, priority)) throw invalid('Regra de avaliação inválida.');
  return { committeeKeys: [...new Set(committeeKeys)].sort(), roomIds: [...new Set(roomIds)].sort(), priority, includeGeneral, includeUnassessed };
}

// Creation time defines "last entered"; editing an older note does not promote it.
const created = note => Date.parse(note.createdAt) || 0;
export function consolidateRubrics(notes, options, sessions = []) {
  const eligible = notes.filter(note => options.committeeKeys.includes(note.committeeKey) && note.participant
    && (note.source === 'general' ? options.includeGeneral : options.roomIds.includes(note.session?.roomId)));
  const comites = options.committeeKeys.map(key => {
    const committeeNotes = eligible.filter(note => note.committeeKey === key);
    const names = [...new Set([...(options.includeUnassessed ? committeeDelegations(key) : []), ...committeeNotes.map(note => note.participant)])].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const delegacoes = names.map(nome => {
      const records = committeeNotes.filter(note => note.participant === nome);
      const ratings = {}, evidence = {};
      for (const { id } of EVALUATION_CRITERIA) {
        const candidates = records.filter(note => Number.isInteger(note.ratings?.[id]) && note.ratings[id] >= 1 && note.ratings[id] <= 5);
        candidates.sort((a, b) => {
          const scoreOrder = options.priority === 'highest' ? b.ratings[id] - a.ratings[id] : options.priority === 'lowest' ? a.ratings[id] - b.ratings[id] : 0;
          return scoreOrder || created(b) - created(a) || a.id.localeCompare(b.id);
        });
        const winner = candidates[0];
        ratings[id] = winner?.ratings[id] ?? null;
        evidence[id] = winner ? { noteId: winner.id, createdAt: winner.createdAt, source: winner.source, session: winner.session || null, author: winner.author || null, text: winner.text, candidates: candidates.length } : null;
      }
      return {
        key: rubricKey(key, nome), nome, ratings, evidence,
        criterios_gerais: Object.fromEntries(Object.entries(GENERAL_RUBRIC_KEYS).map(([id, output]) => [output, scoreLevel(ratings[id])])),
        dpo_questoes: Object.fromEntries(DPO_QUESTION_IDS.map((id, index) => [`question${index + 1}`, scoreConcept(ratings[id])])),
        dpo_formatacao: scoreConcept(ratings.dpoStructure), avaliacao_final: '',
        assessedCount: Object.values(ratings).filter(score => score !== null).length,
      };
    }).filter(item => options.includeUnassessed || item.assessedCount > 0);
    return { chave_comite: key, nome_comite: COMMITTEE_NAMES[key], delegacoes };
  });
  const selectedSessions = sessions.filter(session => options.roomIds.includes(session.id)).sort((a, b) => a.id.localeCompare(b.id));
  const fingerprint = createHash('sha256').update(JSON.stringify({ options, selectedSessions, comites })).digest('hex');
  return { options, sessions: selectedSessions, fingerprint, scale: { originalRatings: '1–5', criterios_gerais: '1–5 estrelas; null = não avaliado', conversion: { 1: 'D / 1 estrela', 2: 'D / 2 estrelas', 3: 'C / 3 estrelas', 4: 'B / 4 estrelas', 5: 'A / 5 estrelas' } }, comites, delegationCount: comites.reduce((total, committee) => total + committee.delegacoes.length, 0), noteCount: eligible.length };
}

export function applyFinalAssessments(report, finals = {}) {
  if (!finals || typeof finals !== 'object' || Array.isArray(finals)) throw invalid('Avaliações finais inválidas.');
  const keys = new Set(report.comites.flatMap(committee => committee.delegacoes.map(item => item.key)));
  for (const [key, text] of Object.entries(finals)) {
    if (!keys.has(key) || typeof text !== 'string' || text.length > 500) throw invalid('Avaliação final inválida (máximo de 500 caracteres).');
  }
  return { ...report, comites: report.comites.map(committee => ({ ...committee, delegacoes: committee.delegacoes.map(item => ({ ...item, avaliacao_final: (finals[item.key] || '').trim() })) })) };
}
