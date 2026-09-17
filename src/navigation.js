export const roomTabs = ['gsl', 'motions', 'mod', 'unmod', 'solo', 'vote', 'presence', 'notes'];

export function restoredRoomTab(requested, current, { independentTabs = false, closed = false } = {}) {
  // Reloading an old URL must not move every connected chair or the projector.
  return (independentTabs || closed) && roomTabs.includes(requested) ? requested : current || 'gsl';
}

export function parseRoute(hash) {
  const parts = String(hash || '').replace(/^#\/?/, '').split('/');
  if (parts[0] === 'sala' && /^[a-zA-Z0-9-]+$/.test(parts[1] || '')) {
    return { page: 'room', roomId: parts[1], tab: roomTabs.includes(parts[2]) ? parts[2] : null };
  }
  if (parts[0] === 'admin' && parts[1] === 'ajuda') return { page: 'admin', section: 'help', ticketId: /^[a-zA-Z0-9-]+$/.test(parts[2] || '') ? parts[2] : null };
  if (parts[0] === 'admin') return { page: 'admin', section: parts[1] === 'pendencias' ? 'import' : 'rooms' };
  if (parts[0] === 'visitante') return { page: 'visitor', tab: roomTabs.includes(parts[1]) ? parts[1] : null };
  return { page: { notas: 'notes', rubricas: 'rubrics' }[parts[0]] || 'rooms' };
}

// The fragment works with the existing server and offline shell, without rewrites.
export function createNavigation(browser) {
  let current = browser.location.hash || '#/salas';
  let index = Number.isInteger(browser.history.state?.simsdIndex) ? browser.history.state.simsdIndex : 0;
  let revision = 0;
  let pending = null;
  let guard = async () => true;
  const listeners = new Set();
  const write = (method, hash, position) => browser.history[method]({ ...browser.history.state, simsdIndex: position }, '', hash);
  write('replaceState', current, index);
  const publish = hash => { current = hash; listeners.forEach(listener => listener()); };
  const allowed = async hash => { try { return await guard(parseRoute(hash), parseRoute(current)); } catch { return false; } };
  const navigate = async (hash, { replace = false, passive = false } = {}) => {
    if (hash === current) return true;
    if (passive && pending !== null) return false;
    const request = ++revision;
    pending = request;
    const canLeave = await allowed(hash);
    if (pending === request) pending = null;
    if (!canLeave || request !== revision) return false;
    if (!replace) index++;
    write(replace ? 'replaceState' : 'pushState', hash, index);
    publish(hash);
    return true;
  };
  const onPop = async () => {
    const target = browser.location.hash || '#/salas';
    if (target === current) return;
    const request = ++revision;
    pending = request;
    const targetIndex = browser.history.state?.simsdIndex;
    const canLeave = await allowed(target);
    if (pending === request) pending = null;
    if (canLeave) {
      if (request !== revision) return;
      index = Number.isInteger(targetIndex) ? targetIndex : index + 1;
      write('replaceState', target, index);
      publish(target);
    } else if (request === revision) {
      if (Number.isInteger(targetIndex) && targetIndex !== index) browser.history.go(index - targetIndex);
      else write('replaceState', current, index);
    }
  };
  browser.addEventListener('popstate', onPop);
  return {
    navigate,
    getSnapshot: () => current,
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    setGuard: callback => { guard = callback; return () => { guard = async () => true; }; },
    dispose: () => browser.removeEventListener('popstate', onPop),
  };
}
