import { createHash } from 'node:crypto';
import { serializeSessionState } from './sessionState.js';
import { mergeSession } from './sessionMerge.js';

export function previewPendingImport(backup, room, preference = null) {
  const invalid = message => { throw Object.assign(new Error(message), { status: 400 }); };
  if (!backup || typeof backup.room?.id !== 'string' || !Object.hasOwn(backup, 'baseState')) invalid('Selecione o JSON gerado por “Baixar cópia local”.');
  if (!room || room.id !== backup.room.id) throw Object.assign(new Error('A sala original deste arquivo não foi encontrada. Não é possível importar em outra sala.'), { status: 404 });
  if (room.status !== 'open') throw Object.assign(new Error('Reabra a sala antes de importar as alterações pendentes.'), { status: 409 });
  serializeSessionState(backup.state);
  if (backup.baseState !== null) serializeSessionState(backup.baseState);
  for (const state of [backup.state, backup.baseState]) {
    if (state?.committeeKey && state.committeeKey !== room.committee_key) invalid('O comitê do arquivo não corresponde ao da sala.');
  }
  if (preference !== null && !['local', 'remote'].includes(preference)) invalid('Escolha como resolver os conflitos.');
  const remote = JSON.parse(room.session_state || 'null');
  const merged = mergeSession(backup.baseState, backup.state, remote, preference);
  serializeSessionState(merged.state);
  const token = createHash('sha256').update(JSON.stringify({ roomId: room.id, version: room.state_version, state: backup.state, baseState: backup.baseState })).digest('hex');
  return { ...merged, token, version: room.state_version, room: { id: room.id, name: room.name, code: room.code },
    counts: { notesBefore: remote?.notes?.length || 0, notesAfter: merged.state.notes?.length || 0, eventsBefore: remote?.events?.length || 0, eventsAfter: merged.state.events?.length || 0 } };
}
