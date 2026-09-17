import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = mkdtempSync(join(tmpdir(), 'simsd-auth-test-'));
process.env.SIMSD_DATABASE_PATH = join(directory, 'auth.sqlite');
process.env.SIMSD_OAUTH_CLIENT_ID = 'test-client';
process.env.SIMSD_OAUTH_CLIENT_SECRET = 'test-secret';
process.env.SIMSD_OAUTH_REDIRECT_URI = 'https://app.example.test/auth/callback';
process.env.SIMSD_OAUTH_BASE_URL = 'https://portal.example.test';
process.env.SIMSD_COOKIE_SECURE = '1';
process.env.SIMSD_SESSION_HOURS = '24';
const auth = await import('../server/auth.js');
const { db } = await import('../server/database.js');
after(() => { db.close(); rmSync(directory, { recursive: true, force: true }); });

function response() {
  return {
    headers: {}, getHeader(name) { return this.headers[name]; },
    setHeader(name, value) { this.headers[name] = value; },
    writeHead(status, headers) { this.status = status; Object.assign(this.headers, headers); }, end() {},
  };
}

test('OAuth login lasts a full day even when the portal token expires after one minute', async t => {
  const start = Date.parse('2026-09-17T12:00:00Z');
  t.mock.timers.enable({ apis: ['Date'], now: start });
  t.mock.method(globalThis, 'fetch', async url => {
    if (url.pathname === '/oauth/token') return new Response(JSON.stringify({ access_token: 'test-token', expires_in: 60 }));
    assert.equal(url.pathname, '/oauth/userinfo');
    return new Response(JSON.stringify({ id: 'test-user', name: 'Teste', role: 'simsd_tools' }));
  });
  const begin = response();
  auth.beginOAuth(begin);
  const state = new URL(begin.headers.Location).searchParams.get('state');
  const result = response();
  await auth.finishOAuth({ headers: { cookie: `simsd_oauth_state=${state}` } }, result,
    new URL(`https://app.example.test/auth/callback?state=${state}&code=test-code`));
  const cookie = result.headers['Set-Cookie'].find(value => value.startsWith('simsd_session='));
  assert.match(cookie, /Max-Age=86400/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /; Secure/);
  const stored = db.prepare('SELECT * FROM app_sessions').get();
  assert.equal(Date.parse(stored.expires_at) - Date.parse(stored.created_at), 86400000);
  const request = { headers: { cookie: cookie.split(';')[0] } };
  t.mock.timers.setTime(start + 86399000);
  assert.equal(auth.getAuthenticatedUser(request).name, 'Teste');
  t.mock.timers.setTime(start + 86400000);
  assert.equal(auth.getAuthenticatedUser(request), null);
});

test('invalid or shorter configured durations fall back to 24 hours', () => {
  for (const value of ['', '1', '0', '-1', 'invalid', 'Infinity', '24.5', '721']) {
    process.env.SIMSD_SESSION_HOURS = value;
    assert.equal(auth.sessionLifetimeSeconds(), 86400);
  }
  process.env.SIMSD_SESSION_HOURS = '48';
  assert.equal(auth.sessionLifetimeSeconds(), 172800);
  process.env.SIMSD_SESSION_HOURS = '24';
});
