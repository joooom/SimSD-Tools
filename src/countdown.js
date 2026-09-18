export { projectedState } from './src/clockState.js';

// Intervals repaint; elapsed time, not the number of callbacks, drives clocks.
export function startCountdown(clock, tick, now = () => performance.now(), serverNow = () => window.SimSDSync?.serverNow?.() ?? Date.now()) {
  const started = now();
  const fields = 'spkSec' in clock ? ['spkSec', 'totalSec'] : ['sec'];
  const initial = Object.fromEntries(fields.map(field => [field, clock[field]]));
  const at = serverNow();
  clock.playback = { running: true, deadlines: Object.fromEntries(fields.map(field => [field, at + initial[field] * 1000])) };
  let lastSecond = -1, lastCheckpoint = 0;
  return setInterval(() => {
    const elapsed = Math.max(0, now() - started);
    const second = Math.min(Math.floor(elapsed / 1000), ...Object.values(initial));
    if (second === lastSecond) return;
    lastSecond = second;
    const checkpoint = elapsed - lastCheckpoint >= 5000;
    if (checkpoint) lastCheckpoint = elapsed;
    tick(Object.fromEntries(fields.map(field => [field, Math.max(0, initial[field] - second)])), checkpoint);
  }, 1000);
}

export function stopCountdown(clock) {
  clearInterval(clock.iv);
  clock.playback = { running: false };
}

