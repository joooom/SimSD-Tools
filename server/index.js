import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { db, cleanupExpired, nowIso, publicUser, upsertPortalUser } from './database.js';
import {
  authResponse, beginOAuth, createAppSession, finishOAuth, getAuthenticatedUser,
  logout, oauthConfigured,
} from './auth.js';
import { buildReport, saveReport } from './reports.js';
import { buildLlmReport } from './llmReport.js';
import { appendSessionEvent, finishSessionActivities } from './sessionEvents.js';
import { listGeneralNotes, listNoteSessions, saveGeneralNote, deleteGeneralNote, changeSessionNote, noteFilters } from './generalNotes.js';
import { generalNotesReport, generalNotesXml } from './generalNotesReport.js';
import { rubricOptions, consolidateRubrics, applyFinalAssessments } from './rubrics.js';
import { buildRubricDocx } from './rubricDocx.js';
import { sendHelpRequest } from './helpRequests.js';
import { serializeSessionState } from './sessionState.js';
import { previewPendingImport } from './pendingImport.js';

const DEV_SERVER = process.argv.includes('--dev');
const PORT = Number(process.env.PORT || (DEV_SERVER ? 4174 : 4173));
const HOST = process.env.HOST || '127.0.0.1';
const DIST_DIR = resolve('dist');
const DEV_AUTH = process.env.SIMSD_DEV_AUTH === '1';
const socketsByRoom = new Map();
const projectorByRoom = new Map();
const projectionTabs = new Set(['gsl', 'motions', 'mod', 'unmod', 'solo', 'vote', 'presence', 'notes']);
function projectorState(roomId) {
  const selected = projectorByRoom.get(roomId);
  return selected ? { clientId: selected.socket.simsdClientId, name: selected.socket.simsdUser.name, tab: selected.tab, speechMode: selected.speechMode } : null;
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp',
};

function sendJson(res, status, value, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(value));
}

async function readJson(req, limit = 2_500_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('Corpo da requisição muito grande.'), { status: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('JSON inválido.'), { status: 400 }); }
}

function requireUser(req) {
  const user = getAuthenticatedUser(req);
  if (!user) throw Object.assign(new Error('Autenticação necessária.'), { status: 401 });
  return user;
}

function requireAdmin(req) {
  const user = requireUser(req);
  if (user.role !== 'admin') throw Object.assign(new Error('Acesso administrativo necessário.'), { status: 403 });
  return user;
}

function roomById(id) {
  return db.prepare(`
    SELECT rooms.*, users.name owner_name FROM rooms
    JOIN users ON users.id=rooms.owner_user_id WHERE rooms.id=?
  `).get(id);
}

function isMember(roomId, userId) {
  return Boolean(db.prepare('SELECT 1 FROM room_members WHERE room_id=? AND user_id=?').get(roomId, userId));
}

function canAccessRoom(room, user) {
  if (!room || !user) return false;
  if (user.role === 'admin' || room.owner_user_id === user.id || isMember(room.id, user.id)) return true;
  return user.role === 'simsd_tools' && room.status === 'open';
}

function canManageRoom(room, user) {
  return user.role === 'admin' || room.owner_user_id === user.id;
}

function publicRoom(room, user) {
  return {
    id: room.id, code: room.code, name: room.name, committeeKey: room.committee_key,
    owner: { id: room.owner_user_id, name: room.owner_name }, status: room.status,
    stateVersion: room.state_version, createdAt: room.created_at, updatedAt: room.updated_at,
    endedAt: room.ended_at, canManage: canManageRoom(room, user),
  };
}

function generateRoomCode() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = randomBytes(4).toString('base64url').replace(/[-_]/g, '').slice(0, 6).toUpperCase();
    if (code.length === 6 && !db.prepare('SELECT 1 FROM rooms WHERE code=?').get(code)) return code;
  }
  return randomUUID().slice(0, 6).toUpperCase();
}

function listRooms(user) {
  const all = db.prepare(`
    SELECT rooms.*, users.name owner_name FROM rooms
    JOIN users ON users.id=rooms.owner_user_id ORDER BY rooms.updated_at DESC
  `).all();
  return all.filter(room => canAccessRoom(room, user)).map(room => publicRoom(room, user));
}

function broadcast(roomId, payload, except = null) {
  const message = JSON.stringify(payload);
  for (const socket of socketsByRoom.get(roomId) || []) {
    if (socket !== except && socket.readyState === WebSocket.OPEN) socket.send(message);
  }
}

function broadcastPresence(roomId) {
  const clients = [...(socketsByRoom.get(roomId) || [])].filter(socket => socket.readyState === WebSocket.OPEN && !socket.simsdViewer);
  broadcast(roomId, {
    type: 'presence', count: clients.length,
    users: clients.map(socket => ({ id: socket.simsdUser.id, name: socket.simsdUser.name, role: socket.simsdUser.role })),
  });
}

function closeRoom(room, user) {
  if (room.status === 'closed') return JSON.parse(db.prepare("SELECT payload FROM reports WHERE room_id=? AND report_type='final' ORDER BY id DESC LIMIT 1").get(room.id)?.payload || JSON.stringify(buildReport(room, 'final')));
  const endedAt = nowIso();
  const state = JSON.parse(room.session_state || 'null');
  if (state) {
    finishSessionActivities(state, 'session_closed', endedAt);
    appendSessionEvent(state, 'session.closed', { actor: { id: user.id, name: user.name } }, endedAt);
    db.prepare('UPDATE rooms SET session_state=?,state_version=state_version+1 WHERE id=?').run(JSON.stringify(state), room.id);
  }
  db.prepare('UPDATE rooms SET status=\'closed\',ended_at=?,updated_at=? WHERE id=?').run(endedAt, endedAt, room.id);
  const closed = roomById(room.id);
  const report = saveReport(closed, 'final', user.id);
  broadcast(room.id, { type: 'room:closed', report, state: JSON.parse(closed.session_state || 'null'), version: closed.state_version });
  return report;
}

async function handleApi(req, res, url) {
  const method = req.method || 'GET';
  if (url.pathname === '/api/config' && method === 'GET') {
    return sendJson(res, 200, { oauthConfigured: oauthConfigured(), devAuth: DEV_AUTH });
  }
  if (url.pathname === '/api/me' && method === 'GET') {
    const user = getAuthenticatedUser(req);
    return sendJson(res, 200, { user: user ? authResponse(user) : null });
  }
  if (url.pathname === '/api/logout' && method === 'POST') {
    logout(req, res);
    return sendJson(res, 200, { ok: true });
  }
  if (url.pathname === '/api/dev/login' && method === 'POST') {
    if (!DEV_AUTH) throw Object.assign(new Error('Login de desenvolvimento desativado.'), { status: 404 });
    const body = await readJson(req);
    const role = ['admin', 'simsd_tools', 'student'].includes(body.role) ? body.role : 'student';
    const suffix = String(body.suffix || role).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || role;
    const user = upsertPortalUser({
      id: `dev-${suffix}`, name: body.name || `Teste ${role}`, role,
      email: `${suffix}@dev.local`, login: `${suffix}@dev.local`, committee: role === 'student' ? 'unesco' : null,
    });
    createAppSession(res, user);
    return sendJson(res, 200, { user: publicUser(user) });
  }

  const user = requireUser(req);
  if (['/api/admin/pending-import/preview', '/api/admin/pending-import/apply'].includes(url.pathname)) {
    requireAdmin(req);
    if (method !== 'POST') throw Object.assign(new Error('Método não permitido.'), { status: 405 });
    const body = await readJson(req, 12_000_000);
    const roomId = body?.backup?.room?.id;
    const room = typeof roomId === 'string' ? roomById(roomId) : null;
    const preview = previewPendingImport(body?.backup, room, body?.preference ?? null);
    if (url.pathname.endsWith('/preview')) {
      const { state, ...result } = preview;
      return sendJson(res, 200, result);
    }
    if (body.token !== preview.token) throw Object.assign(new Error('A sala ou o arquivo mudou. Analise o arquivo novamente antes de aplicar.'), { status: 409 });
    if (preview.conflicts.length && !body.preference) throw Object.assign(new Error('Escolha se os conflitos devem usar os valores do arquivo ou da sala.'), { status: 409 });
    const updatedAt = nowIso();
    appendSessionEvent(preview.state, 'session.pending_imported', { actor: { id: user.id, name: user.name } }, updatedAt);
    const serialized = serializeSessionState(preview.state);
    db.prepare('UPDATE rooms SET session_state=?,state_version=state_version+1,updated_at=? WHERE id=?').run(serialized, updatedAt, room.id);
    broadcast(room.id, { type: 'state:update', state: preview.state, version: preview.version + 1, updatedBy: publicUser(user), updatedAt });
    return sendJson(res, 200, { ok: true, room: preview.room });
  }
  if (url.pathname === '/api/help' && method === 'POST') {
    return sendJson(res, 200, await sendHelpRequest(await readJson(req, 8192)));
  }
  if (url.pathname === '/api/rubrics/options' || url.pathname === '/api/rubrics/preview' || url.pathname === '/api/rubrics/export') {
    if (!['admin', 'simsd_tools'].includes(user.role)) throw Object.assign(new Error('Rubricas são restritas a Tools e admins.'), { status: 403 });
    const sessions = listNoteSessions();
    if (url.pathname === '/api/rubrics/options' && method === 'GET') return sendJson(res, 200, { sessions });
    if (method !== 'POST' || url.pathname === '/api/rubrics/options') throw Object.assign(new Error('Método não permitido.'), { status: 405 });
    const body = await readJson(req);
    const options = rubricOptions(body, sessions);
    const report = consolidateRubrics(listGeneralNotes(user), options, sessions);
    if (url.pathname === '/api/rubrics/preview') return sendJson(res, 200, { report });
    if (body.fingerprint !== report.fingerprint) throw Object.assign(new Error('As notas ou a seleção mudaram. Gere uma nova prévia antes de baixar.'), { status: 409 });
    let finalized = applyFinalAssessments(report, body.finals);
    if (body.committeeKey) {
      if (!options.committeeKeys.includes(body.committeeKey)) throw Object.assign(new Error('Comitê fora da seleção.'), { status: 400 });
      finalized = { ...finalized, comites: finalized.comites.filter(committee => committee.chave_comite === body.committeeKey) };
    }
    const filename = `rubricas-${body.committeeKey || 'geral'}`;
    if (body.format === 'json') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Disposition': `attachment; filename="${filename}.json"` });
      return res.end(JSON.stringify(finalized, null, 2));
    }
    if (body.format !== 'docx') throw Object.assign(new Error('Formato inválido.'), { status: 400 });
    const buffer = await buildRubricDocx(finalized);
    res.writeHead(200, { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Cache-Control': 'no-store', 'Content-Disposition': `attachment; filename="${filename}.docx"` });
    return res.end(buffer);
  }
  if (url.pathname === '/api/general-notes' || url.pathname.startsWith('/api/general-notes/')) {
    if (!['admin', 'simsd_tools'].includes(user.role)) throw Object.assign(new Error('Notas gerais são restritas a Tools e admins.'), { status: 403 });
    if (url.pathname === '/api/general-notes' && method === 'GET') {
      return sendJson(res, 200, { notes: listGeneralNotes(user, noteFilters(url.searchParams)), sessions: listNoteSessions() });
    }
    if (url.pathname === '/api/general-notes' && method === 'POST') {
      return sendJson(res, 201, { note: saveGeneralNote(user, await readJson(req)) });
    }
    if (url.pathname === '/api/general-notes/export' && method === 'GET') {
      const filters = noteFilters(url.searchParams);
      const report = generalNotesReport(listGeneralNotes(user, filters), filters, db.prepare('SELECT * FROM rooms WHERE session_state IS NOT NULL').all());
      const format = url.searchParams.get('format') || 'xml';
      if (!['xml', 'json'].includes(format)) throw Object.assign(new Error('Formato inválido.'), { status: 400 });
      const content = format === 'xml' ? generalNotesXml(report) : JSON.stringify(report, null, 2);
      res.writeHead(200, { 'Content-Type': `application/${format}; charset=utf-8`, 'Cache-Control': 'no-store', 'Content-Disposition': `attachment; filename="notas-gerais-avaliacoes.${format}"` });
      return res.end(content);
    }
    const noteMatch = url.pathname.match(/^\/api\/general-notes\/([^/]+)$/);
    if (noteMatch && ['PATCH', 'DELETE'].includes(method)) {
      const body = await readJson(req);
      const id = decodeURIComponent(noteMatch[1]);
      if (id.startsWith('session:')) {
        const { roomId, ...update } = changeSessionNote(user, id, body, method === 'DELETE');
        broadcast(roomId, { type: 'state:update', ...update, updatedBy: publicUser(user) });
        return sendJson(res, 200, { ok: true });
      }
      if (method === 'PATCH') return sendJson(res, 200, { note: saveGeneralNote(user, body, id) });
      deleteGeneralNote(user, id, body);
      return sendJson(res, 200, { ok: true });
    }
  }
  if (url.pathname === '/api/rooms' && method === 'GET') return sendJson(res, 200, { rooms: listRooms(user) });
  if (url.pathname === '/api/rooms' && method === 'POST') {
    if (user.role === 'student') {
      throw Object.assign(new Error('Estudantes não têm permissão para criar salas.'), { status: 403 });
    }
    const body = await readJson(req);
    const name = String(body.name || '').trim().slice(0, 120);
    if (!name) throw Object.assign(new Error('Informe o nome da sala.'), { status: 400 });
    const rawCommittee = String(body.committeeKey || '').trim().toLowerCase();
    const validCommittees = ['camara', 'unodc', 'oea', 'unesco'];
    const committeeKey = validCommittees.includes(rawCommittee) ? rawCommittee : null;
    if (!committeeKey) throw Object.assign(new Error('Comitê inválido.'), { status: 400 });
    const now = nowIso();
    const room = { id: randomUUID(), code: generateRoomCode(), name, committeeKey };
    db.prepare(`INSERT INTO rooms(id,code,name,committee_key,owner_user_id,status,created_at,updated_at) VALUES(?,?,?,?,?,'open',?,?)`)
      .run(room.id, room.code, room.name, room.committeeKey, user.id, now, now);
    db.prepare('INSERT OR IGNORE INTO room_members(room_id,user_id,added_by,created_at) VALUES(?,?,?,?)')
      .run(room.id, user.id, user.id, now);
    return sendJson(res, 201, { room: publicRoom(roomById(room.id), user) });
  }

  const roomMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)(?:\/(members|close|state|reopen))?$/);
  if (roomMatch) {
    const room = roomById(roomMatch[1]);
    if (!room || !canAccessRoom(room, user)) throw Object.assign(new Error('Sala não encontrada ou acesso negado.'), { status: 404 });
    const action = roomMatch[2];
    if (action === 'reopen' && method === 'POST') {
      requireAdmin(req);
      if (room.status === 'closed') {
        const state = JSON.parse(room.session_state || 'null');
        if (state) {
          state.sessionEnded = false;
          appendSessionEvent(state, 'session.reopened', { actor: { id: user.id, name: user.name } });
        }
        db.prepare("UPDATE rooms SET status='open',ended_at=NULL,session_state=?,state_version=state_version+1,updated_at=? WHERE id=?")
          .run(JSON.stringify(state), nowIso(), room.id);
        const reopened = roomById(room.id);
        broadcast(room.id, { type: 'room:reopened', state, version: reopened.state_version });
      }
      return sendJson(res, 200, { room: publicRoom(roomById(room.id), user) });
    }
    if (!action && method === 'GET') return sendJson(res, 200, { room: publicRoom(room, user) });
    if (action === 'state' && method === 'GET') {
      return sendJson(res, 200, { state: JSON.parse(room.session_state || 'null'), version: room.state_version, status: room.status });
    }
    if (action === 'members' && method === 'GET') {
      const dbMembers = db.prepare(`
        SELECT users.* FROM room_members JOIN users ON users.id=room_members.user_id
        WHERE room_members.room_id=? ORDER BY users.name
      `).all(room.id).map(publicUser);
      
      const onlineSockets = [...(socketsByRoom.get(room.id) || [])].filter(s => s.readyState === WebSocket.OPEN && !s.simsdViewer);
      const membersMap = new Map(dbMembers.map(m => [m.id, m]));
      for (const socket of onlineSockets) {
        if (!membersMap.has(socket.simsdUser.id)) {
          membersMap.set(socket.simsdUser.id, publicUser(socket.simsdUser));
        }
      }
      
      for (const socket of onlineSockets) {
        const m = membersMap.get(socket.simsdUser.id);
        if (m) m.isOnline = true;
      }
      
      const members = Array.from(membersMap.values());
      return sendJson(res, 200, { members });
    }
    if (action === 'members' && method === 'POST') {
      if (room.status !== 'open') throw Object.assign(new Error('A sala está encerrada.'), { status: 409 });
      if (!canManageRoom(room, user)) throw Object.assign(new Error('Apenas o criador ou um admin pode adicionar pessoas.'), { status: 403 });
      const body = await readJson(req);
      const identifier = String(body.identifier || '').trim();
      if (!identifier) throw Object.assign(new Error('Informe um identificador de usuário válido.'), { status: 400 });
      const member = db.prepare('SELECT * FROM users WHERE lower(email)=lower(?) OR lower(login)=lower(?) OR portal_id=?').get(identifier, identifier, identifier);
      if (!member) throw Object.assign(new Error('Usuário ainda não autenticou neste app.'), { status: 404 });
      db.prepare('INSERT OR IGNORE INTO room_members(room_id,user_id,added_by,created_at) VALUES(?,?,?,?)')
        .run(room.id, member.id, user.id, nowIso());
      return sendJson(res, 200, { member: publicUser(member) });
    }
    if (action === 'close' && method === 'POST') {
      if (!canManageRoom(room, user)) throw Object.assign(new Error('Apenas o criador ou um admin pode encerrar a sala.'), { status: 403 });
      const body = await readJson(req);
      const current = roomById(room.id);
      if (!current) throw Object.assign(new Error('Sala não encontrada.'), { status: 404 });
      if (current.status === 'closed') return sendJson(res, 200, { report: closeRoom(current, user) });
      if (body && Object.hasOwn(body, 'state')) {
        const serialized = serializeSessionState(body.state);
        if (body.baseVersion !== current.state_version) throw Object.assign(new Error('A sessão mudou. Atualize os dados antes de encerrar.'), { status: 409 });
        db.prepare('UPDATE rooms SET session_state=?,state_version=state_version+1,updated_at=? WHERE id=?')
          .run(serialized, nowIso(), room.id);
      }
      return sendJson(res, 200, { report: closeRoom(roomById(room.id), user) });
    }
  }

  if (url.pathname === '/api/users/search' && method === 'GET') {
    if (user.role === 'student') throw Object.assign(new Error('Acesso não autorizado à busca de usuários.'), { status: 403 });
    const rawQuery = String(url.searchParams.get('q') || '').trim().slice(0, 80);
    if (!rawQuery) return sendJson(res, 200, { users: [] });
    const escaped = rawQuery.replace(/[%_\\]/g, '\\$&');
    const query = `%${escaped}%`;
    const users = db.prepare("SELECT * FROM users WHERE (name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR login LIKE ? ESCAPE '\\') ORDER BY name LIMIT 20")
      .all(query, query, query).map(publicUser);
    return sendJson(res, 200, { users });
  }

  const adminRoomMatch = url.pathname.match(/^\/api\/admin\/rooms\/([^/]+)$/);
  if (adminRoomMatch && method === 'DELETE') {
    requireAdmin(req);
    const room = roomById(adminRoomMatch[1]);
    if (!room) throw Object.assign(new Error('Sala não encontrada.'), { status: 404 });
    db.prepare('DELETE FROM rooms WHERE id=?').run(room.id);
    broadcast(room.id, { type: 'room:deleted' });
    if (socketsByRoom.has(room.id)) {
      for (const socket of socketsByRoom.get(room.id)) socket.close();
      socketsByRoom.delete(room.id);
    }
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === '/api/admin/rooms' && method === 'GET') {
    requireAdmin(req);
    const rooms = db.prepare(`
      SELECT rooms.*, users.name owner_name,
        (SELECT COUNT(*) FROM room_members WHERE room_id=rooms.id) member_count
      FROM rooms JOIN users ON users.id=rooms.owner_user_id ORDER BY rooms.updated_at DESC
    `).all().map(room => ({ ...publicRoom(room, user), memberCount: room.member_count }));
    return sendJson(res, 200, { rooms });
  }
  const llmMatch = url.pathname.match(/^\/api\/admin\/rooms\/([^/]+)\/llm-report$/);
  if (llmMatch && method === 'GET') {
    requireAdmin(req);
    const room = roomById(llmMatch[1]);
    if (!room) throw Object.assign(new Error('Sala não encontrada.'), { status: 404 });
    res.writeHead(200, {
      'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="relatorio-avaliativo-llm-${room.code.replace(/[^a-zA-Z0-9_-]/g, '')}.xml"`,
    });
    return res.end(buildLlmReport(room));
  }
  const reportMatch = url.pathname.match(/^\/api\/admin\/rooms\/([^/]+)\/report$/);
  if (reportMatch && method === 'GET') {
    const admin = requireAdmin(req);
    const room = roomById(reportMatch[1]);
    if (!room) throw Object.assign(new Error('Sala não encontrada.'), { status: 404 });
    const type = url.searchParams.get('type') === 'final' ? 'final' : 'partial';
    if (type === 'final' && room.status !== 'closed') throw Object.assign(new Error('O relatório final só existe após o encerramento.'), { status: 409 });
    const report = type === 'final'
      ? JSON.parse(db.prepare(`SELECT payload FROM reports WHERE room_id=? AND report_type='final' ORDER BY id DESC LIMIT 1`).get(room.id)?.payload || JSON.stringify(saveReport(room, 'final', admin.id)))
      : buildReport(room, 'partial');
    return sendJson(res, 200, {
      report,
      state: JSON.parse(room.session_state || 'null'),
      room: publicRoom(room, user),
    });
  }
  if (url.pathname === '/api/admin/reports' && method === 'GET') {
    requireAdmin(req);
    const reports = db.prepare(`
      SELECT reports.id,reports.room_id,reports.report_type,reports.created_at,rooms.name room_name
      FROM reports JOIN rooms ON rooms.id=reports.room_id ORDER BY reports.created_at DESC LIMIT 100
    `).all().map(row => ({ id: row.id, roomId: row.room_id, roomName: row.room_name, type: row.report_type, createdAt: row.created_at }));
    return sendJson(res, 200, { reports });
  }
  throw Object.assign(new Error('Endpoint não encontrado.'), { status: 404 });
}

function serveStatic(res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const safePath = normalize(pathname).replace(/^([/\\])+/, '');
  let filePath = resolve(DIST_DIR, safePath);
  if (!filePath.startsWith(DIST_DIR) || !existsSync(filePath) || statSync(filePath).isDirectory()) filePath = join(DIST_DIR, 'index.html');
  if (!existsSync(filePath)) throw Object.assign(new Error('Build não encontrado. Execute npm run build.'), { status: 503 });
  res.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream' });
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    cleanupExpired();
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/auth/login') return beginOAuth(res);
    if (url.pathname === '/auth/callback') return await finishOAuth(req, res, url);
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (url.pathname === '/ws') return sendJson(res, 426, { error: 'upgrade_required', message: 'Conexão WebSocket necessária.' });
    return serveStatic(res, url);
  } catch (error) {
    const status = error.status || 500;
    if (!res.headersSent) sendJson(res, status, { error: status >= 500 ? 'server_error' : 'request_error', message: error.message });
    else res.end();
  }
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 2_500_000 });
server.on('upgrade', (req, socket, head) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname !== '/ws') return socket.destroy();
    const origin = req.headers.origin;
    if (origin && new URL(origin).host !== req.headers.host) return socket.destroy();
    const isViewer = url.searchParams.get('mode') === 'viewer';
    const user = getAuthenticatedUser(req);
    if (!isViewer && !user) return socket.destroy();
    const room = roomById(url.searchParams.get('roomId'));
    if (!room) return socket.destroy();
    if (!isViewer && !canAccessRoom(room, user)) return socket.destroy();
    wss.handleUpgrade(req, socket, head, ws => {
      ws.simsdUser = user || { id: 'viewer', name: 'Espectador', role: 'viewer' };
      ws.simsdRoomId = room.id;
      ws.simsdViewer = isViewer;
      wss.emit('connection', ws, req, room);
    });
  } catch { socket.destroy(); }
});

wss.on('connection', (ws, _req, room) => {
  ws.simsdClientId = randomUUID();
  // ws emits error for oversized/invalid frames; without a listener Node exits.
  ws.on('error', () => ws.terminate());
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  if (!socketsByRoom.has(room.id)) socketsByRoom.set(room.id, new Set());
  socketsByRoom.get(room.id).add(ws);
  ws.send(JSON.stringify({
    type: 'state:init', room: publicRoom(room, ws.simsdUser), clientId: ws.simsdClientId, projector: projectorState(room.id),
    state: JSON.parse(room.session_state || 'null'), version: room.state_version,
  }));
  broadcastPresence(room.id);

  ws.on('message', raw => {
    let requestId;
    try {
      const message = JSON.parse(raw.toString());
      if (!message || !['state:update', 'state:request', 'projector:select', 'projector:tab'].includes(message.type)) return;
      requestId = typeof message.requestId === 'string' ? message.requestId.slice(0, 100) : undefined;
      const current = roomById(room.id);
      if (!ws.simsdViewer) {
        const user = getAuthenticatedUser(_req);
        if (!user || !current || !canAccessRoom(current, user)) {
          ws.send(JSON.stringify({ type: 'error', code: 'auth_required', message: 'Sua sessão expirou ou o acesso foi removido.', requestId }));
          ws.close(1008, 'Acesso expirado');
          return;
        }
        ws.simsdUser = user;
      }
      if (message.type === 'state:request') {
        if (current) ws.send(JSON.stringify({ type: 'state:snapshot', state: JSON.parse(current.session_state || 'null'), version: current.state_version, status: current.status, requestId }));
        return;
      }
      if (ws.simsdViewer) return ws.send(JSON.stringify({ type: 'error', message: 'Modo espectador não pode modificar a sessão.', requestId }));
      if (!current || current.status !== 'open') return ws.send(JSON.stringify({ type: 'error', message: 'A sala está encerrada.', requestId }));
      if (message.type === 'projector:select' || message.type === 'projector:tab') {
        const selected = projectorByRoom.get(room.id);
        if (message.type === 'projector:select' && message.enabled === false) {
          if (selected?.socket !== ws) return;
          projectorByRoom.delete(room.id);
        } else {
          if (message.type === 'projector:tab' && selected?.socket !== ws) return;
          if (!projectionTabs.has(message.tab) || !['gsl', 'mod', 'solo'].includes(message.speechMode)) return;
          projectorByRoom.set(room.id, { socket: ws, tab: message.tab, speechMode: message.speechMode });
        }
        broadcast(room.id, { type: 'projector:state', projector: projectorState(room.id) });
        return;
      }
      if (Number(message.baseVersion) !== current.state_version) {
        return ws.send(JSON.stringify({
          type: 'state:conflict', state: JSON.parse(current.session_state || 'null'), version: current.state_version, requestId,
        }));
      }
      const serialized = serializeSessionState(message.state);
      const version = current.state_version + 1;
      const updatedAt = nowIso();
      db.prepare('UPDATE rooms SET session_state=?,state_version=?,updated_at=? WHERE id=?').run(serialized, version, updatedAt, room.id);
      const payload = { type: 'state:update', state: message.state, version, updatedBy: publicUser(ws.simsdUser), updatedAt };
      ws.send(JSON.stringify({ type: 'state:ack', version, updatedAt, requestId }));
      broadcast(room.id, payload, ws);
    } catch (error) {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'error', message: error.status ? error.message : 'Mensagem WebSocket inválida.', requestId }));
    }
  });
  ws.on('close', () => {
    if (projectorByRoom.get(room.id)?.socket === ws) {
      projectorByRoom.delete(room.id);
      broadcast(room.id, { type: 'projector:state', projector: null });
    }
    socketsByRoom.get(room.id)?.delete(ws);
    if (!socketsByRoom.get(room.id)?.size) socketsByRoom.delete(room.id);
    else broadcastPresence(room.id);
  });
});

const heartbeatInterval = setInterval(() => {
  for (const sockets of socketsByRoom.values()) {
    for (const ws of sockets) {
      if (ws.isAlive === false) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

server.listen(PORT, HOST, () => {
  console.log(`SimSD Chair server: http://${HOST}:${PORT}`);
  if (!oauthConfigured()) console.log('OAuth não configurado: defina SIMSD_OAUTH_CLIENT_ID, SIMSD_OAUTH_CLIENT_SECRET e SIMSD_OAUTH_REDIRECT_URI.');
  if (DEV_AUTH) console.log('SIMSD_DEV_AUTH ativo — use apenas em desenvolvimento/testes.');
});
