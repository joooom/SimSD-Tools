// Questions and terminology from the supplied gerador_rubricas.py.
export const DPO_QUESTION_IDS = ['dpoPlatformWorkers', 'dpoPastActions', 'dpoBillPosition', 'dpoAmendments'];
export const DPO_QUESTIONS = {
  camara: [
    'Como a representação lida e se posiciona nos debates sobre os trabalhadores plataformizados?',
    'O que a representação já fez em relação ao tópico de debate?',
    'Qual é o posicionamento de sua representação em relação ao projeto de lei, em especial ao substitutivo 2?',
    'Quais são as emendas que a representação busca trazer para a audiência pública do PLP 152/2025?',
  ],
  oea: [
    'Quais são as principais vulnerabilidades de seu país diante do crime organizado transnacional?',
    'Que tipo de apoio internacional seu país necessita para fortalecer sua segurança interna?',
    'Como o seu país lida com o crime organizado em seu território? E internacionalmente?',
    'Quais as medidas passadas, atuais e futuras que seu país tem em relação ao crime organizado transnacional?',
  ],
  unesco: [
    'Qual é o contexto do país em relação a problemática a ser discutida? Como ela impacta a nação?',
    'Quais foram as ações prévias da nação representada em relação a regulamentação do uso das Inteligências artificiais?',
    'Qual o posicionamento da nação a respeito do uso das Inteligências artificiais na educação dos jovens?',
    'Quais são possíveis soluções que a delegação pretende apresentar no comitê?',
  ],
  unodc: [
    'Onde e como o país entra na cadeia global da cannabis?',
    'Quais as políticas do país em relação a produção e consumo de cannabis? Como elas impactam os jovens?',
    'Qual o posicionamento da nação a respeito do crescente uso de drogas entre jovens?',
    'Quais são possíveis soluções que a delegação pretende apresentar no comitê?',
  ],
};

export const GENERAL_RUBRIC_KEYS = {
  topicKnowledge: 'dominio_tema', foreignPolicy: 'aderencia_politica', debateParticipation: 'participacao_debates',
  diplomacy: 'cooperacao_diplomacia', resolutionWriting: 'elaboracao_resolucao', decorum: 'decoro', punctuality: 'pontualidade', dpo: 'dpo',
};
export const PRIORITY_LABELS = { highest: 'Maior nota prioritária', lowest: 'Menor nota prioritária', latest: 'Última nota lançada' };
export const rubricKey = (committeeKey, participant) => `${committeeKey}:${participant}`;
export const scoreConcept = score => score == null ? '' : score === 5 ? 'A' : score === 4 ? 'B' : score === 3 ? 'C' : 'D';
export const scoreLevel = score => score == null ? null : score;
export const scoreStars = score => score == null ? 'Não avaliado' : '☆'.repeat(scoreLevel(score));
export function rubricLabel(criterion, committeeKey) {
  const question = DPO_QUESTION_IDS.indexOf(criterion.id);
  if (question >= 0) return DPO_QUESTIONS[committeeKey]?.[question] || criterion.label;
  if (committeeKey === 'camara' && criterion.id === 'foreignPolicy') return 'Aderência ao posicionamento oficial do deputado/organização representado';
  if (committeeKey === 'camara' && criterion.id === 'diplomacy') return 'Cooperação e negociação';
  return criterion.label;
}
