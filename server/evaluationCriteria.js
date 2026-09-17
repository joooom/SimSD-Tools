import { CAMARA, DELEGATIONS } from './flags.js';

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
  {"id":"dpoPlatformWorkers","label":"Como a representação lida e se posiciona nos debates sobre os trabalhadores plataformizados?","parentId":"dpo"},
  {"id":"dpoPastActions","label":"O que a representação já fez em relação ao tópico de debate?","parentId":"dpo"},
  {"id":"dpoBillPosition","label":"Qual é o posicionamento de sua representação em relação ao projeto de lei, em especial ao substitutivo 2?","parentId":"dpo"},
  {"id":"dpoAmendments","label":"Quais são as emendas que a representação busca trazer para a audiência pública do PLP 152/2025?","parentId":"dpo"},
  {"id":"dpoStructure","label":"O documento respeitou a estrutura do DPO explicada no guia de estudos?","parentId":"dpo"},
];

export const EVALUATION_GROUPS = [
  { id: 'general', label: 'Avaliação geral', criteria: EVALUATION_CRITERIA.filter(item => item.id !== 'dpo' && !item.parentId) },
  { id: 'dpo', label: 'DPO', criteria: EVALUATION_CRITERIA.filter(item => item.id === 'dpo' || item.parentId === 'dpo') },
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
