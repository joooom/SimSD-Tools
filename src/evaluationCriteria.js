import { CAMARA, DELEGATIONS } from './utils/flags.js';

export const COMMITTEE_NAMES = {
  camara: 'Câmara dos Deputados', unodc: 'UNODC', oea: 'OEA', unesco: 'UNESCO',
};

export const EVALUATION_CRITERIA = [
  { id: 'topicKnowledge', label: 'Domínio do tema debatido' },
  { id: 'foreignPolicy', label: 'Aderência à política externa do país representado' },
  { id: 'debateParticipation', label: 'Participação e contribuição nos debates' },
  { id: 'diplomacy', label: 'Cooperação e diplomacia' },
  { id: 'resolutionWriting', label: 'Participação na elaboração do documento de resolução' },
  { id: 'decorum', label: 'Decoro' },
  { id: 'punctuality', label: 'Pontualidade' },
  { id: 'dpo', label: 'DPO' },
];

export const NOTE_KINDS = { dpo: 'DPO', observation: 'Observação geral', evaluation: 'Avaliação' };

export function committeeDelegations(key) {
  const names = key === 'camara' ? CAMARA.map(item => item.c) : DELEGATIONS[key] || [];
  return [...names].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function validateRatings(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Avaliações inválidas.');
  const known = new Set(EVALUATION_CRITERIA.map(item => item.id));
  for (const [key, score] of Object.entries(value)) {
    if (!known.has(key)) throw new Error('Critério de avaliação desconhecido.');
    if (score !== null && (!Number.isInteger(score) || score < 1 || score > 5)) throw new Error('Cada avaliação deve ser um número inteiro de 1 a 5.');
  }
  return Object.fromEntries(EVALUATION_CRITERIA.map(item => [item.id, value[item.id] ?? null]));
}
