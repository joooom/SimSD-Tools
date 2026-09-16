import { randomUUID } from 'node:crypto';
import { db, nowIso } from './database.js';
import { COMMITTEE_NAMES, NOTE_KINDS, EVALUATION_CRITERIA, committeeDelegations, validateRatings } from './evaluationCriteria.js';
import { appendSessionEvent } from './sessionEvents.js';
import { matchesNote } from './noteFilters.js';

const badRequest = message => Object.assign(new Error(message), { status: 400 });

export function noteFilters(searchParams) {
  const filters = Object.fromEntries(['committeeKey', 'delegation', 'source', 'search', 'day', 'roomId'].map(key => [key, (searchParams.get(key) || '').trim()]));
  if (filters.day && (!/^\d{4}-\d{2}-\d{2}$/.test(filters.day) || !Number.isFinite(Date.parse(filters.day)) || new Date(filters.day).toISOString().slice(0, 10) !== filters.day)) throw badRequest('Dia inválido.');
  if (filters.committeeKey && !Object.hasOwn(COMMITTEE_NAMES, filters.committeeKey)) throw badRequest('Comitê inválido.');
  if (filters.source && !['general', 'session'].includes(filters.source)) throw badRequest('Origem inválida.');
  if (filters.search.length > 200 || filters.delegation.length > 200 || filters.roomId.length > 200) throw badRequest('Filtro muito longo.');
  return filters;
}

export function listNoteSessions() {
  return db.prepare('SELECT id,name,code,status,committee_key,session_state FROM rooms WHERE session_state IS NOT NULL ORDER BY created_at DESC,id').all().flatMap(room => {
    try {
      const state = JSON.parse(room.session_state);
      return [{ id: room.id, roomName: room.name, code: room.code, status: room.status, committeeKey: state?.committeeKey || room.committee_key, name: state?.config?.session || '' }];
    } catch { return []; }
  });
}

function canEditSession(room, user) {
  return room.status === 'open' && (user.role === 'admin' || user.role === 'simsd_tools');
}

function publicNote(row, user) {
  return {
    id: row.id, source: 'general', committeeKey: row.committee_key,
    committee: COMMITTEE_NAMES[row.committee_key], participant: row.delegation,
    type: row.kind, text: row.text, ratings: JSON.parse(row.ratings),
    author: { id: row.created_by, name: row.author_name }, createdAt: row.created_at,
    updatedAt: row.updated_at, version: row.version,
    canEdit: user.role === 'admin' || row.created_by === user.id,
  };
}

export function listGeneralNotes(user, filters = {}) {
  const notes = filters.source === 'session' ? [] : db.prepare(`
    SELECT general_notes.*, users.name author_name FROM general_notes
    JOIN users ON users.id=general_notes.created_by ORDER BY general_notes.created_at DESC, general_notes.id
  `).all().map(row => publicNote(row, user));
  if (filters.source !== 'general') {
    for (const room of db.prepare('SELECT * FROM rooms WHERE session_state IS NOT NULL').all()) {
      let state;
      try { state = JSON.parse(room.session_state); } catch { continue; }
      if (!Array.isArray(state?.notes)) continue;
      for (const [index, note] of state.notes.entries()) {
        if (!note || typeof note !== 'object') continue;
        const committeeKey = Object.hasOwn(COMMITTEE_NAMES, state.committeeKey || '') ? state.committeeKey : room.committee_key;
        const ratings = Object.fromEntries(EVALUATION_CRITERIA.map(({ id }) => {
          const score = note.ratings?.[id];
          return [id, Number.isInteger(score) && score >= 1 && score <= 5 ? score : null];
        }));
        const speech = note.speech && typeof note.speech === 'object' ? {
          mode: typeof note.speech.mode === 'string' ? note.speech.mode : '',
          participant: typeof note.speech.participant === 'string' ? note.speech.participant : null,
          position: Number.isInteger(note.speech.position) ? note.speech.position : null,
          completedSpeeches: Number.isInteger(note.speech.completedSpeeches) ? note.speech.completedSpeeches : null,
          remainingSeconds: Number.isFinite(note.speech.remainingSeconds) ? note.speech.remainingSeconds : null,
          activityId: typeof note.speech.activityId === 'string' ? note.speech.activityId : null,
        } : null;
        notes.push({
          id: `session:${room.id}:${note.id || index}`, source: 'session',
          committeeKey, committee: typeof state.config?.committee === 'string' ? state.config.committee : COMMITTEE_NAMES[committeeKey],
          participant: typeof note.participant === 'string' ? note.participant : null,
          type: typeof note.type === 'string' ? note.type : 'general', text: typeof note.text === 'string' ? note.text : '',
          ratings, author: null, createdAt: typeof note.createdAt === 'string' ? note.createdAt : null,
          updatedAt: note.updatedAt || null, version: room.state_version,
          speech, session: { roomId: room.id, roomName: room.name, name: typeof state.config?.session === 'string' ? state.config.session : '' }, canEdit: canEditSession(room, user),
        });
      }
    }
  }
  return notes.filter(note => matchesNote(note, filters))
    .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || a.id.localeCompare(b.id));
}

export function saveGeneralNote(user, body, id = null) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw badRequest('Dados da nota inválidos.');
  const { committeeKey, participant, type = 'dpo' } = body;
  if (!Object.hasOwn(COMMITTEE_NAMES, committeeKey || '')) throw badRequest('Selecione um comitê válido.');
  if (!committeeDelegations(committeeKey).includes(participant)) throw badRequest('Selecione uma delegação do comitê escolhido.');
  if (!Object.hasOwn(NOTE_KINDS, type)) throw badRequest('Tipo de nota inválido.');
  if (body.text !== undefined && typeof body.text !== 'string') throw badRequest('Texto da nota inválido.');
  const text = (body.text || '').trim();
  if (text.length > 10000) throw badRequest('A nota deve ter no máximo 10.000 caracteres.');
  let ratings;
  try { ratings = validateRatings(body.ratings); } catch (error) { throw badRequest(error.message); }
  if (!text && !Object.values(ratings).some(value => value !== null)) throw badRequest('Escreva uma nota ou avalie pelo menos um critério.');
  const now = nowIso();
  if (id) {
    const existing = db.prepare('SELECT * FROM general_notes WHERE id=?').get(id);
    if (!existing) throw Object.assign(new Error('Nota não encontrada.'), { status: 404 });
    if (existing.created_by !== user.id && user.role !== 'admin') throw Object.assign(new Error('Somente o autor ou um admin pode editar esta nota.'), { status: 403 });
    if (body.version !== existing.version) throw Object.assign(new Error('Esta nota foi alterada por outra pessoa. Atualize a lista antes de editar.'), { status: 409 });
    db.prepare('UPDATE general_notes SET committee_key=?,delegation=?,kind=?,text=?,ratings=?,updated_at=?,version=version+1 WHERE id=?')
      .run(committeeKey, participant, type, text, JSON.stringify(ratings), now, id);
  } else {
    id = randomUUID();
    db.prepare('INSERT INTO general_notes(id,committee_key,delegation,kind,text,ratings,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)')
      .run(id, committeeKey, participant, type, text, JSON.stringify(ratings), user.id, now, now);
  }
  const row = db.prepare('SELECT general_notes.*,users.name author_name FROM general_notes JOIN users ON users.id=created_by WHERE general_notes.id=?').get(id);
  return publicNote(row, user);
}

export function deleteGeneralNote(user, id, body) {
  const existing = db.prepare('SELECT * FROM general_notes WHERE id=?').get(id);
  if (!existing) throw Object.assign(new Error('Nota não encontrada.'), { status: 404 });
  if (existing.created_by !== user.id && user.role !== 'admin') throw Object.assign(new Error('Somente o autor ou um admin pode excluir esta nota.'), { status: 403 });
  if (body?.version !== existing.version) throw Object.assign(new Error('Esta nota foi alterada. Atualize a lista antes de excluir.'), { status: 409 });
  db.prepare('DELETE FROM general_notes WHERE id=?').run(id);
}

export function changeSessionNote(user, id, body, remove = false) {
  const [, roomId, ...parts] = id.split(':');
  const noteId = parts.join(':');
  const room = db.prepare('SELECT * FROM rooms WHERE id=?').get(roomId);
  if (!room) throw Object.assign(new Error('Sala não encontrada.'), { status: 404 });
  if (!canEditSession(room, user)) throw Object.assign(new Error('Notas de sessões encerradas não podem ser alteradas. Reabra a sala para editar.'), { status: 403 });
  if (body?.version !== room.state_version) throw Object.assign(new Error('A sessão foi alterada. Atualize a lista antes de continuar.'), { status: 409 });
  const state = JSON.parse(room.session_state || '{}');
  const index = (state.notes || []).findIndex((note, i) => String(note.id || i) === noteId);
  if (index < 0) throw Object.assign(new Error('Nota não encontrada.'), { status: 404 });
  const note = state.notes[index];
  const now = nowIso();
  if (remove) state.notes.splice(index, 1);
  else {
    if (typeof body.text !== 'string' || body.text.length > 10000) throw badRequest('Texto da nota inválido (máximo de 10.000 caracteres).');
    let ratings;
    try { ratings = validateRatings(body.ratings); } catch (error) { throw badRequest(error.message); }
    if (!body.text.trim() && !Object.values(ratings).some(value => value !== null)) throw badRequest('Escreva uma nota ou avalie pelo menos um critério.');
    state.notes[index] = { ...note, text: body.text.trim(), ratings, updatedAt: now };
  }
  appendSessionEvent(state, remove ? 'note.deleted' : 'note.updated', { noteId: note.id, updatedBy: user.id }, now);
  db.prepare('UPDATE rooms SET session_state=?,state_version=state_version+1,updated_at=? WHERE id=?').run(JSON.stringify(state), now, room.id);
  return { roomId, state, version: room.state_version + 1, updatedAt: now };
}
