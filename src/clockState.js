// A viewer never runs session actions or replays missed ticks. It projects the
// latest authoritative deadline at the current estimated server time.
export function projectedState(state, now) {
  if (!state || state.sessionEnded) return state;
  let result = state;
  for (const key of ['timer', 'mod', 'unmod', 'solo']) {
    const clock = state[key];
    if (!clock?.playback?.running) continue;
    const fields = key === 'mod' ? ['spkSec', 'totalSec'] : ['sec'];
    const values = {};
    // A moderated speaker's expiry pauses the debate as well.
    const stopAt = Math.min(...fields.map(field => clock.playback.deadlines?.[field] ?? Infinity));
    for (const field of fields) {
      const deadline = clock.playback.deadlines?.[field];
      if (Number.isFinite(deadline)) values[field] = Math.max(0, Math.ceil((deadline - Math.min(now, stopAt)) / 1000));
    }
    if (fields.every(field => values[field] === undefined || values[field] === clock[field])) continue;
    if (result === state) result = { ...state };
    result[key] = { ...clock, ...values };
  }
  return result;
}
