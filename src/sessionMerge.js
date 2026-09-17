export const sameState = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export const copyState = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.hasOwn(value || {}, key) ? value[key] : undefined;

export function mergeSession(base, local, remote, preference = null) {
  const conflicts = [];
  function merge(before, ours, theirs, path) {
    if (sameState(ours, theirs)) return copyState(ours);
    if (sameState(before, ours)) return copyState(theirs);
    if (sameState(before, theirs)) return copyState(ours);
    if (object(ours) && object(theirs) && (object(before) || before == null)) {
      return Object.fromEntries([...new Set([...Object.keys(before || {}), ...Object.keys(ours), ...Object.keys(theirs)])]
        .map(key => [key, merge(own(before, key), own(ours, key), own(theirs, key), [...path, key])]).filter(([, value]) => value !== undefined));
    }
    if (Array.isArray(ours) && Array.isArray(theirs) && Array.isArray(before)) {
      const keyOf = row => row && typeof row === 'object' && !Array.isArray(row) ? row.id || row.eventId : null;
      const lists = [before, ours, theirs];
      if (lists.every(list => list.every(keyOf) && new Set(list.map(keyOf)).size === list.length)) {
        const [baseMap, ourMap, theirMap] = lists.map(list => new Map(list.map(row => [keyOf(row), row])));
        const keys = [...new Set([...theirs.map(keyOf), ...ours.map(keyOf), ...before.map(keyOf)])];
        return keys.map(key => merge(baseMap.get(key), ourMap.get(key), theirMap.get(key), [...path, String(key)])).filter(value => value !== undefined);
      }
    }
    conflicts.push({ path: path.join('.'), local: copyState(ours), remote: copyState(theirs) });
    return copyState(preference === 'remote' ? theirs : ours);
  }
  const state = merge(base, local, remote, []);
  // Speech totals are increments, not competing replacements. Validate them
  // against newly recorded GSL completions and count shared event IDs once.
  const baseIds = new Set((base?.events || []).map(event => event.id));
  const completions = source => (source?.events || []).filter(event => !baseIds.has(event.id) && event.type === 'speech.finished' && event.details?.mode === 'gsl');
  const ours = completions(local), theirs = completions(remote);
  for (const participant of new Set([...ours, ...theirs].map(event => event.details.participant).filter(Boolean))) {
    const localEvents = ours.filter(event => event.details.participant === participant);
    const remoteEvents = theirs.filter(event => event.details.participant === participant);
    const union = [...new Map([...remoteEvents, ...localEvents].map(event => [event.id, event])).values()];
    for (const key of ['speeches', 'speakTime']) {
      const sum = events => events.reduce((total, event) => total + (key === 'speeches' ? 1 : Math.max(0, Number(event.details.seconds) || 0)), 0);
      const initial = base?.[key]?.[participant] || 0;
      if (Number.isFinite(initial) && local?.[key]?.[participant] === initial + sum(localEvents) && remote?.[key]?.[participant] === initial + sum(remoteEvents)) {
        state[key] = { ...state[key], [participant]: initial + sum(union) };
        const index = conflicts.findIndex(conflict => conflict.path === `${key}.${participant}`);
        if (index >= 0) conflicts.splice(index, 1);
      }
    }
  }
  return { state, conflicts };
}
