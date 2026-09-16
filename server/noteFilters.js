import { NOTE_KINDS } from './evaluationCriteria.js';

export const noteDay = value => Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value)) : '';
export const matchesSearch = (values, search) => !search || values.join(' ').toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'));

export function matchesNote(note, filters) {
  return (!filters.committeeKey || note.committeeKey === filters.committeeKey)
    && (!filters.roomId || note.session?.roomId === filters.roomId)
    && (!filters.source || note.source === filters.source)
    && (!filters.delegation || note.participant === filters.delegation)
    && (!filters.day || noteDay(note.createdAt) === filters.day)
    && matchesSearch([note.text, note.participant, note.committee, note.author?.name, note.session?.roomName, note.session?.name, NOTE_KINDS[note.type]], filters.search);
}
