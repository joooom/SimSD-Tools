import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { db, nowIso, publicUser, upsertPortalUser } from './database.js';

const OAUTH_BASE = process.env.SIMSD_OAUTH_BASE_URL || 'https://simsd.sdomingos.com.br';
const CLIENT_ID = process.env.SIMSD_OAUTH_CLIENT_ID || '';
const CLIENT_SECRET = process.env.SIMSD_OAUTH_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.SIMSD_OAUTH_REDIRECT_URI || '';
const COOKIE_SECURE = process.env.SIMSD_COOKIE_SECURE !== '0';

export const SESSION_COOKIE = 'simsd_session';
const FLOW_COOKIE = 'simsd_oauth_state';

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function base64url(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

function cookie(name, value, options = {}) {
  const securePart = COOKIE_SECURE ? '; Secure' : '';
  const maxAgePart = options.maxAge !== undefined ? `; Max-Age=${options.maxAge}` : '';
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax${securePart}${maxAgePart}`;
}

function appendCookie(res, value) {
  const current = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', current ? [...(Array.isArray(current) ? current : [current]), value] : value);
}

export function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(part => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }));
}

export function oauthConfigured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET && REDIRECT_URI);
}

export function beginOAuth(res) {
  if (!oauthConfigured()) throw Object.assign(new Error('OAuth SimSD não configurado no servidor.'), { status: 503 });
  const state = base64url(randomBytes(32));
  const verifier = base64url(randomBytes(64));
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const now = new Date();
  db.prepare('INSERT INTO oauth_flows(state_hash,verifier,expires_at,created_at) VALUES(?,?,?,?)')
    .run(sha256(state), verifier, new Date(now.getTime() + 5 * 60_000).toISOString(), now.toISOString());
  const url = new URL('/oauth/authorize', OAUTH_BASE);
  url.search = new URLSearchParams({
    response_type: 'code', client_id: CLIENT_ID, redirect_uri: REDIRECT_URI,
    scope: 'profile email', state, code_challenge: challenge, code_challenge_method: 'S256',
  }).toString();
  appendCookie(res, cookie(FLOW_COOKIE, state, { maxAge: 300 }));
  res.writeHead(302, { Location: url.toString() });
  res.end();
}

function safeEqual(a, b) {
  const left = Buffer.from(a || '');
  const right = Buffer.from(b || '');
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function finishOAuth(req, res, url) {
  const cookies = parseCookies(req);
  const returnedState = url.searchParams.get('state') || '';
  const expectedState = cookies[FLOW_COOKIE] || '';
  appendCookie(res, cookie(FLOW_COOKIE, '', { maxAge: 0 }));
  if (!safeEqual(returnedState, expectedState)) throw Object.assign(new Error('Estado OAuth inválido.'), { status: 400 });
  const flow = db.prepare('SELECT * FROM oauth_flows WHERE state_hash = ? AND expires_at > ?').get(sha256(returnedState), nowIso());
  db.prepare('DELETE FROM oauth_flows WHERE state_hash = ?').run(sha256(returnedState));
  if (!flow) throw Object.assign(new Error('Fluxo OAuth expirado ou já utilizado.'), { status: 400 });
  if (url.searchParams.get('error')) throw Object.assign(new Error('Autorização cancelada no portal SimSD.'), { status: 400 });
  const code = url.searchParams.get('code');
  if (!code) throw Object.assign(new Error('Código OAuth ausente.'), { status: 400 });

  const credentials = Buffer.from(`${encodeURIComponent(CLIENT_ID)}:${encodeURIComponent(CLIENT_SECRET)}`).toString('base64');
  const tokenResponse = await fetch(new URL('/oauth/token', OAUTH_BASE), {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI, code_verifier: flow.verifier }),
  });
  const tokenData = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenData.access_token) throw Object.assign(new Error(tokenData.error_description || 'Falha ao trocar o código OAuth.'), { status: 401 });

  const profileResponse = await fetch(new URL('/oauth/userinfo', OAUTH_BASE), {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileResponse.json().catch(() => ({}));
  if (!profileResponse.ok || !['admin', 'simsd_tools', 'student'].includes(profile.role)) {
    throw Object.assign(new Error('Perfil SimSD inválido ou não autorizado.'), { status: 403 });
  }
  const user = upsertPortalUser(profile);
  createAppSession(res, user, Math.min(Number(tokenData.expires_in) || 3600, 3600));
  res.writeHead(302, { Location: '/' });
  res.end();
}

export function createAppSession(res, user, lifetimeSeconds = 3600) {
  const token = base64url(randomBytes(32));
  const now = new Date();
  db.prepare('INSERT INTO app_sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)')
    .run(sha256(token), user.id, new Date(now.getTime() + lifetimeSeconds * 1000).toISOString(), now.toISOString());
  appendCookie(res, cookie(SESSION_COOKIE, token, { maxAge: lifetimeSeconds }));
}

export function getAuthenticatedUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const row = db.prepare(`
    SELECT users.* FROM app_sessions JOIN users ON users.id=app_sessions.user_id
    WHERE app_sessions.token_hash=? AND app_sessions.expires_at>?
  `).get(sha256(token), nowIso());
  return row || null;
}

export function logout(req, res) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) db.prepare('DELETE FROM app_sessions WHERE token_hash=?').run(sha256(token));
  appendCookie(res, cookie(SESSION_COOKIE, '', { maxAge: 0 }));
}

export function authResponse(user) {
  return publicUser(user);
}
