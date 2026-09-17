import { mkdirSync, writeFileSync } from 'node:fs';
import { COMMITTEE_NAMES, EVALUATION_CRITERIA, committeeDelegations } from '../server/evaluationCriteria.js';
import { generalNotesReport, generalNotesXml } from '../server/generalNotesReport.js';

// Uses the same serializer as the home page; never touches the application database.
const notes = [], rooms = [];
for (const [committeeKey, committee] of Object.entries(COMMITTEE_NAMES)) {
  const names = committeeDelegations(committeeKey);
  for (const day of [15, 16]) {
    const roomId = `mock-${committeeKey}-${day}`;
    const at = minute => new Date(Date.UTC(2026, 8, day, 12, minute)).toISOString();
    const state = {
      committeeKey, config: { conference: 'SimSD — MOCK FICTÍCIO', committee, session: `Sessão de exemplo — ${day}/09/2026` },
      agenda: 'Agenda fictícia para testar relatórios e avaliações',
      committeeCountries: names.map(c => ({ c })), presence: Object.fromEntries(names.map(c => [c, 'presente'])),
      notes: [], events: [], eventLogStartedAt: at(0), sessionEnded: true,
      speeches: {}, speakTime: {}, eventActivities: {},
    };
    const event = (type, minute, details) => state.events.push({ id: `${roomId}-event-${state.events.length}`, type, at: at(minute), details });
    event('session.started', 0, { agenda: state.agenda });
    names.forEach((participant, index) => {
      const ratings = Object.fromEntries(EVALUATION_CRITERIA.map(({ id }, criterion) => [id, 1 + ((index + criterion + day) % 5)]));
      const note = {
        id: `${roomId}-note-${index}`, type: 'speech', participant,
        text: `MOCK — registro fictício de ${participant}. Apresentou argumentos sobre a agenda, dialogou com outras delegações e contribuiu para uma proposta conjunta. As pontuações são exemplos sintéticos, sem avaliação de pessoas reais.`,
        ratings, createdAt: at(index * 2 + 2),
        speech: { mode: 'gsl', participant, position: index + 1, activityId: `${roomId}-speech-${index}`, remainingSeconds: 0 },
      };
      state.notes.push(note);
      state.speeches[participant] = 1; state.speakTime[participant] = 60;
      event('speech.started', index * 2 + 1, { activityId: note.speech.activityId, participant, mode: 'gsl', initialSeconds: 60 });
      event('speech.finished', index * 2 + 2, { activityId: note.speech.activityId, participant, mode: 'gsl', seconds: 60, reason: 'completed' });
      event('note.added', index * 2 + 2, { noteId: note.id, participant, type: note.type });
      notes.push({ ...note, id: `session:${roomId}:${note.id}`, source: 'session', committeeKey, committee, author: null, session: { roomId, roomName: `Sala mock ${committee}`, name: state.config.session } });
      if (day === 15) notes.push({
        id: `mock-dpo-${committeeKey}-${index}`, source: 'general', committeeKey, committee, participant, type: 'dpo',
        text: `MOCK — DPO fictício de ${participant}, usado apenas para testar o relatório geral.`,
        ratings: Object.fromEntries(EVALUATION_CRITERIA.map(({ id, parentId }) => [id, id === 'dpo' || parentId === 'dpo' ? ratings[id] : null])),
        createdAt: at(0), updatedAt: at(0), author: { id: 'mock-author', name: 'Avaliador fictício' }, version: 1,
      });
    });
    event('motion.added', names.length * 2 + 3, { text: 'Moção fictícia para votação da proposta', status: 'approved' });
    event('vote.finished', names.length * 2 + 4, { title: 'Proposta fictícia', result: 'approved', votes: Object.fromEntries(names.map(c => [c, 'fav'])) });
    event('session.closed', names.length * 2 + 5, { reason: 'Fim da sessão de exemplo' });
    rooms.push({ id: roomId, code: `MOCK-${committeeKey}-${day}`, name: `Sala mock ${committee}`, status: 'closed', committee_key: committeeKey, created_at: at(0), ended_at: at(names.length * 2 + 5), session_state: JSON.stringify(state) });
  }
}
const report = generalNotesReport(notes, {}, rooms);
report.mock = true;
report.title = 'MOCK FICTÍCIO — todos os comitês e delegações';
mkdirSync('examples', { recursive: true });
writeFileSync('examples/notas-gerais-mock.xml', generalNotesXml(report));
console.log(`Mock gerado: ${Object.keys(COMMITTEE_NAMES).length} comitês, ${Object.keys(COMMITTEE_NAMES).reduce((sum, key) => sum + committeeDelegations(key).length, 0)} delegações, ${rooms.length} sessões, ${notes.length} notas.`);
