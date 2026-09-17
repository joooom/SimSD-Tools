const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function serializeSessionState(state) {
  const invalid = field => { throw Object.assign(new Error(`Estado da sessão inválido: ${field}.`), { status: 400 }); };
  if (!record(state)) invalid('objeto esperado');
  for (const field of ['notes', 'events', 'committeeCountries', 'speakers', 'history', 'motions', 'voteHistory']) {
    if (state[field] !== undefined && (!Array.isArray(state[field]) || !state[field].every(record))) invalid(field);
  }
  for (const field of ['config', 'presence', 'speeches', 'speakTime', 'timer', 'mod', 'unmod', 'solo', 'votes', 'voteConfig', 'customNames', 'eventActivities']) {
    if (state[field] !== undefined && !record(state[field])) invalid(field);
  }
  const serialized = JSON.stringify(state);
  if (Buffer.byteLength(serialized, 'utf8') > 2_000_000) {
    throw Object.assign(new Error('Estado da sessão muito grande.'), { status: 413 });
  }
  return serialized;
}
