import { db, nowIso } from './database.js';

function parseState(room) {
  try { return JSON.parse(room.session_state || '{}'); } catch { return {}; }
}

export function buildReport(room, type = 'partial') {
  const state = parseState(room);
  const countries = Array.isArray(state.committeeCountries) ? state.committeeCountries : [];
  const presence = state.presence || {};
  const speeches = state.speeches || {};
  const speakTime = state.speakTime || {};
  const motions = Array.isArray(state.motions) ? state.motions : [];
  const votes = Array.isArray(state.voteHistory) ? state.voteHistory : [];
  const present = countries.filter(item => presence[item.c] === 'presente').length;
  const voting = countries.filter(item => presence[item.c] === 'presente-votante').length;
  const totalSpeakingSeconds = Object.values(speakTime).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const speechRanking = countries.map(item => ({
    participant: item.c,
    speeches: Number(speeches[item.c]) || 0,
    speakingSeconds: Number(speakTime[item.c]) || 0,
  })).sort((a, b) => b.speakingSeconds - a.speakingSeconds || b.speeches - a.speeches);
  return {
    type,
    generatedAt: nowIso(),
    room: { id: room.id, code: room.code, name: room.name, status: room.status, createdAt: room.created_at, endedAt: room.ended_at },
    session: {
      conference: state.config?.conference || '', committee: state.config?.committee || room.committee_key || '',
      session: state.config?.session || '', agenda: state.agenda || '', activeTab: state.activeTab || '',
    },
    summary: {
      participants: countries.length, present, voting, absent: Math.max(0, countries.length - present - voting),
      speeches: Object.values(speeches).reduce((sum, value) => sum + (Number(value) || 0), 0),
      totalSpeakingSeconds, motions: motions.length,
      approvedMotions: motions.filter(item => item.status === 'approved').length,
      votes: votes.length,
    },
    speechRanking,
    motions,
    votes,
    presence: countries.map(item => ({ participant: item.c, subtitle: item.sub || '', status: presence[item.c] || 'ausente' })),
  };
}

export function saveReport(room, type, userId) {
  const payload = buildReport(room, type);
  db.prepare('INSERT INTO reports(room_id,report_type,payload,created_by,created_at) VALUES(?,?,?,?,?)')
    .run(room.id, type, JSON.stringify(payload), userId, payload.generatedAt);
  return payload;
}
