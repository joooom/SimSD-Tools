// Shared by the chair and server lifecycle actions. Payloads are snapshots,
// so later edits to a motion, vote or note cannot rewrite previous events.
export function appendSessionEvent(state, type, details = {}, at = new Date().toISOString()) {
  if (!Array.isArray(state.events)) state.events = [];
  if (!state.eventLogStartedAt) state.eventLogStartedAt = at;
  const event = { id: crypto.randomUUID(), type, at, details: structuredClone(details) };
  state.events.push(event);
  return event;
}

export function finishSessionActivities(state, reason, at = new Date().toISOString()) {
  const remaining = { gsl: state.timer?.sec, mod: state.mod?.spkSec, 'mod-debate': state.mod?.totalSec, unmod: state.unmod?.sec, solo: state.solo?.sec };
  for (const [key, activity] of Object.entries(state.eventActivities || {})) {
    appendSessionEvent(state, `${activity.kind}.finished`, {
      activityId: activity.id, mode: activity.mode, participant: activity.participant,
      startedAt: activity.startedAt, seconds: Math.max(0, activity.initialSeconds - (remaining[key] ?? activity.initialSeconds)), reason,
    }, at);
  }
  state.eventActivities = {};
}
