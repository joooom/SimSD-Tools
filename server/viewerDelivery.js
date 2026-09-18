const fields = ['config', 'committeeCountries', 'presence', 'speakers', 'curIdx', 'timer', 'mod', 'unmod', 'solo', 'motions', 'votes', 'voteConfig', 'customNames', 'activeTab', 'speechMode', 'agenda', 'sessionEnded'];

export function viewerState(state) {
  if (!state) return state;
  return Object.fromEntries(fields.filter(key => Object.hasOwn(state, key)).map(key => [key, state[key]]));
}

// At most one write plus the latest pending snapshot per viewer. Slow viewers
// must not consume memory by accumulating the room's entire update history.
export function sendViewerState(socket, payload) {
  socket.viewerPending = JSON.stringify({ ...payload, state: viewerState(payload.state) });
  if (socket.viewerWriting) return;
  const flush = () => {
    if (socket.readyState !== 1 || !socket.viewerPending) return;
    const message = socket.viewerPending;
    socket.viewerPending = null;
    socket.viewerWriting = true;
    socket.viewerWriteTimer = setTimeout(() => socket.terminate(), 10000);
    socket.send(message, error => {
      clearTimeout(socket.viewerWriteTimer);
      socket.viewerWriting = false;
      if (error) return socket.terminate();
      flush();
    });
  };
  flush();
}
