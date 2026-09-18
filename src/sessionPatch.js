const safeKey = key => !['__proto__', 'prototype', 'constructor'].includes(key);

export function statePatch(before, after) {
  const set = Object.fromEntries(Object.entries(after).filter(([key, value]) => safeKey(key) && JSON.stringify(value) !== JSON.stringify(before?.[key])));
  const remove = Object.keys(before || {}).filter(key => safeKey(key) && !Object.hasOwn(after, key));
  return { set, remove };
}

export function applyStatePatch(before, patch) {
  if (!patch || !patch.set || typeof patch.set !== 'object' || Array.isArray(patch.set)
    || !Array.isArray(patch.remove) || ![...Object.keys(patch.set), ...patch.remove].every(key => typeof key === 'string' && safeKey(key))) {
    throw Object.assign(new Error('Atualização parcial inválida.'), { status: 400 });
  }
  const state = { ...(before || {}), ...patch.set };
  for (const key of patch.remove) delete state[key];
  return state;
}
