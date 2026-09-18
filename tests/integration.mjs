import assert from 'node:assert/strict';
import { WebSocket } from 'ws';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
const wsBase = base.replace(/^http/, 'ws');
const suffix = Date.now().toString(36);

async function request(path, { cookie, method = 'GET', body, expected = 200 } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  assert.equal(response.status, expected, `${method} ${path}: ${response.status} ${JSON.stringify(data)}`);
  return { response, data };
}

async function login(role, name) {
  const { response, data } = await request('/api/dev/login', {
    method: 'POST', body: { role, suffix: `${name}-${suffix}`, name }, expected: 200,
  });
  const cookie = response.headers.get('set-cookie').split(';', 1)[0];
  return { cookie, user: data.user };
}

class Inbox {
  constructor(socket) {
    this.messages = [];
    this.waiters = [];
    socket.on('message', raw => {
      const value = JSON.parse(raw.toString());
      const waiterIndex = this.waiters.findIndex(waiter => waiter.type === value.type);
      if (waiterIndex >= 0) this.waiters.splice(waiterIndex, 1)[0].resolve(value);
      else this.messages.push(value);
    });
  }
  next(type, timeout = 3000) {
    const found = this.messages.findIndex(message => message.type === type);
    if (found >= 0) return Promise.resolve(this.messages.splice(found, 1)[0]);
    return new Promise((resolve, reject) => {
      const waiter = { type, resolve: value => { clearTimeout(timer); resolve(value); } };
      const timer = setTimeout(() => {
        this.waiters = this.waiters.filter(item => item !== waiter);
        reject(new Error(`Timeout aguardando ${type}`));
      }, timeout);
      this.waiters.push(waiter);
    });
  }
}

async function connect(roomId, cookie) {
  const socket = new WebSocket(`${wsBase}/ws?roomId=${roomId}`, { headers: { Cookie: cookie } });
  const inbox = new Inbox(socket);
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  return { socket, inbox };
}

const owner = await login('simsd_tools', 'Owner Chair');
const invited = await login('student', 'Invited Student');
const outsider = await login('student', 'Outside Student');
const tools = await login('simsd_tools', 'Tools User');
const admin = await login('admin', 'Admin User');
assert.equal((await request('/api/me', { cookie: 'broken=%ZZ; simsd_session=%ZZ' })).data.user, null);
assert.equal((await request('/api/me', { cookie: `broken=%ZZ; ${owner.cookie}` })).data.user.id, owner.user.id);

await request('/api/help', { method: 'POST', body: { room: '1', message: 'Ajuda' }, expected: 401 });
await request('/api/help', { cookie: invited.cookie, method: 'POST', body: { room: '', message: 'Ajuda' }, expected: 400 });
assert.equal((await request('/api/help', { cookie: invited.cookie, method: 'POST', body: { room: ' 204/A ', message: ' Ajuda com áudio & projetor? ' } })).data.ok, true);

// Independent notes are shared by staff, never by students or guests.
const dpoDetails = { dpoPlatformWorkers: 1, dpoPastActions: 2, dpoBillPosition: 3, dpoAmendments: 4, dpoStructure: 5 };
const generalDraft = { committeeKey: 'unesco', participant: 'Brasil', type: 'dpo', text: `DPO & <análise> ${suffix}`, ratings: { dpo: 4, topicKnowledge: 5, ...dpoDetails } };
await request('/api/general-notes', { expected: 401 });
await request('/api/general-notes/export', { expected: 401 });
await request('/api/general-notes', { cookie: invited.cookie, expected: 403 });
await request('/api/general-notes', { cookie: invited.cookie, method: 'POST', body: generalDraft, expected: 403 });
await request('/api/general-notes/export?format=json', { cookie: invited.cookie, expected: 403 });
for (const invalid of [0, 6, 1.5, '3']) {
  await request('/api/general-notes', { cookie: tools.cookie, method: 'POST', body: { ...generalDraft, ratings: { dpo: invalid } }, expected: 400 });
}
for (const invalid of [
  { committeeKey: 'invalid' }, { committeeKey: 'oea', participant: 'França' },
  { ratings: { unknown: 3 } }, { ratings: [], text: '' }, { ratings: {}, text: '' },
]) await request('/api/general-notes', { cookie: tools.cookie, method: 'POST', body: { ...generalDraft, ...invalid }, expected: 400 });
const generalNote = (await request('/api/general-notes', { cookie: tools.cookie, method: 'POST', body: generalDraft, expected: 201 })).data.note;
assert.equal(generalNote.ratings.dpo, 4);
for (const [criterion, score] of Object.entries(dpoDetails)) assert.equal(generalNote.ratings[criterion], score);
assert.equal(generalNote.ratings.decorum, null);
assert.equal(generalNote.author.id, tools.user.id);
assert.equal(generalNote.canEdit, true);
const sharedNote = (await request('/api/general-notes', { cookie: owner.cookie })).data.notes.find(note => note.id === generalNote.id);
assert.equal(sharedNote.canEdit, false);
await request(`/api/general-notes/${generalNote.id}`, { cookie: owner.cookie, method: 'PATCH', body: { ...generalDraft, version: 1 }, expected: 403 });
await request(`/api/general-notes/${generalNote.id}`, { cookie: invited.cookie, method: 'PATCH', body: { ...generalDraft, version: 1 }, expected: 403 });
const editedNote = (await request(`/api/general-notes/${generalNote.id}`, { cookie: admin.cookie, method: 'PATCH', body: { ...generalDraft, ratings: { dpo: 5, ...dpoDetails }, version: 1 } })).data.note;
assert.equal(editedNote.version, 2);
await request(`/api/general-notes/${generalNote.id}`, { cookie: tools.cookie, method: 'PATCH', body: { ...generalDraft, version: 1 }, expected: 409 });
const ratingOnly = (await request('/api/general-notes', { cookie: tools.cookie, method: 'POST', body: { committeeKey: 'camara', participant: 'Dep. Erika Hilton', type: 'evaluation', ratings: { diplomacy: 3 } }, expected: 201 })).data.note;
assert.equal(ratingOnly.text, '');
const filtered = (await request('/api/general-notes?committeeKey=unesco&delegation=Brasil&source=general', { cookie: tools.cookie })).data.notes;
assert.deepEqual(filtered.map(note => note.id), [generalNote.id]);
const generalExport = (await request('/api/general-notes/export?format=json&committeeKey=unesco', { cookie: tools.cookie })).data;
assert.equal(generalExport.notes.length, 1);
assert.equal(generalExport.criteria.length, 13);
assert.equal(generalExport.criteria.filter(criterion => criterion.parentId === 'dpo').length, 5);
for (const [criterion, score] of Object.entries(dpoDetails)) assert.equal(generalExport.notes[0].ratings[criterion], score);
assert.equal(generalExport.notes[0].ratings.dpo, 5);
assert.equal(generalExport.notes[0].canEdit, undefined);
const generalXmlResponse = await fetch(`${base}/api/general-notes/export?committeeKey=unesco`, { headers: { Cookie: admin.cookie } });
assert.match(generalXmlResponse.headers.get('content-type'), /application\/xml/);
const generalXml = await generalXmlResponse.text();
assert.match(generalXml, /<field name="parentId">dpo<\/field>/);
assert.match(generalXml, /<field name="dpoStructure">5<\/field>/);
assert.match(generalXml, /DPO &amp; &lt;análise&gt;/);
assert.match(generalXml, /Domínio do tema debatido/);
await request('/api/general-notes/export?format=exe', { cookie: tools.cookie, expected: 400 });

// Test student permissions: creating room should return 403
await request('/api/rooms', {
  cookie: invited.cookie, method: 'POST', body: { name: `Sala Estudante Inválida ${suffix}`, committeeKey: 'unesco' }, expected: 403,
});

// Test student permissions: accessing admin panel should return 403
await request('/api/admin/rooms', { cookie: invited.cookie, expected: 403 });
await request('/api/admin/reports', { cookie: invited.cookie, expected: 403 });
await request('/api/users/search?q=test', { cookie: invited.cookie, expected: 403 });

const { data: created } = await request('/api/rooms', {
  cookie: owner.cookie, method: 'POST', body: { name: `Integração ${suffix}`, committeeKey: 'unesco' }, expected: 201,
});
const room = created.room;
assert.equal(room.canManage, true);

assert.equal((await request('/api/rooms', { cookie: outsider.cookie })).data.rooms.length, 0);
assert.equal((await request('/api/rooms', { cookie: tools.cookie })).data.rooms.some(item => item.id === room.id), true);
assert.equal((await request('/api/admin/rooms', { cookie: admin.cookie })).data.rooms.some(item => item.id === room.id), true);
await request(`/api/rooms/${room.id}`, { cookie: outsider.cookie, expected: 404 });

await request(`/api/rooms/${room.id}/members`, {
  cookie: owner.cookie, method: 'POST', body: { identifier: invited.user.email },
});
assert.equal((await request('/api/rooms', { cookie: invited.cookie })).data.rooms.some(item => item.id === room.id), true);

// Help chat uses only HTTP, independently of the room websocket.
await request('/api/help', { expected: 401 });
await request('/api/help', { cookie: owner.cookie, method: 'POST', body: { room: '204', roomId: {}, message: 'Teste' }, expected: 400 });
await request('/api/help', { cookie: outsider.cookie, method: 'POST', body: { room: '204', roomId: room.id, message: 'Unauthorized', clientId: 'blocked' }, expected: 404 });
const helpDraft = { room: '204', roomId: room.id, message: 'Projetor sem imagem', clientId: 'help-ticket-1' };
const helpTicket = (await request('/api/help', { cookie: owner.cookie, method: 'POST', body: helpDraft })).data.ticket;
assert.equal(helpTicket.webhookStatus, 'sent');
assert.equal((await request('/api/help', { cookie: owner.cookie, method: 'POST', body: helpDraft })).data.ticket.id, helpTicket.id);
assert.equal((await request('/api/help', { cookie: admin.cookie })).data.tickets.find(t => t.id === helpTicket.id).unread, 1);
assert.equal((await request('/api/help', { cookie: tools.cookie })).data.tickets.some(t => t.id === helpTicket.id), false);
for (const action of ['', '/messages', '/read']) await request(`/api/help/${helpTicket.id}${action}`, { cookie: outsider.cookie, method: action ? 'POST' : 'GET', body: action ? { message: 'No', clientId: 'no', messageId: 1 } : undefined, expected: 404 });
await request(`/api/help/${helpTicket.id}`, { cookie: outsider.cookie, method: 'PATCH', body: { status: 'resolved' }, expected: 404 });
await request(`/api/help/${helpTicket.id}`, { cookie: owner.cookie, method: 'PATCH', body: { status: 'resolved' }, expected: 403 });
await request(`/api/help/${helpTicket.id}/messages`, { cookie: invited.cookie, method: 'POST', body: { message: ' ', clientId: 'blank' }, expected: 400 });
const helpReply = { message: 'Confiram o cabo HDMI & a entrada selecionada <teste>', clientId: 'reply-1' };
const adminReply = (await request(`/api/help/${helpTicket.id}/messages`, { cookie: admin.cookie, method: 'POST', body: helpReply })).data.message;
assert.equal((await request(`/api/help/${helpTicket.id}/messages`, { cookie: admin.cookie, method: 'POST', body: helpReply })).data.message.id, adminReply.id);
const chat = (await request(`/api/help/${helpTicket.id}`, { cookie: invited.cookie })).data;
assert.equal(chat.messages.length, 2);
assert.equal(chat.ticket.status, 'active');
assert.equal(chat.messages[1].message, helpReply.message);
assert.equal(chat.messages[1].admin, true);
assert.equal(chat.ticket.unread, 2);
await request(`/api/help/${helpTicket.id}/read`, { cookie: invited.cookie, method: 'POST', body: { messageId: adminReply.id } });
assert.equal((await request(`/api/help/${helpTicket.id}`, { cookie: invited.cookie })).data.ticket.unread, 0);
await request(`/api/help/${helpTicket.id}/read`, { cookie: invited.cookie, method: 'POST', body: { messageId: chat.messages[0].id } });
assert.equal((await request(`/api/help/${helpTicket.id}`, { cookie: invited.cookie })).data.ticket.unread, 0);
await request(`/api/help/${helpTicket.id}`, { cookie: admin.cookie, method: 'PATCH', body: { status: 'resolved' } });
await request(`/api/help/${helpTicket.id}/messages`, { cookie: owner.cookie, method: 'POST', body: { message: 'Ainda com problema', clientId: 'reopen-reply' }, expected: 409 });
await request(`/api/help/${helpTicket.id}`, { cookie: owner.cookie, method: 'PATCH', body: { status: 'new' } });
for (let i = 0; i < 101; i++) await request(`/api/help/${helpTicket.id}/messages`, { cookie: owner.cookie, method: 'POST', body: { message: `Histórico ${i}`, clientId: `history-${i}` } });
const newestChat = (await request(`/api/help/${helpTicket.id}`, { cookie: admin.cookie })).data;
assert.equal(newestChat.messages.length, 100);
assert.equal(newestChat.hasMore, true);
const olderChat = (await request(`/api/help/${helpTicket.id}?before=${newestChat.messages[0].id}`, { cookie: admin.cookie })).data;
assert.equal(olderChat.messages.length, 3);
assert.equal(olderChat.messages[0].id, chat.messages[0].id);
const incrementalChat = (await request(`/api/help/${helpTicket.id}?after=${adminReply.id}`, { cookie: admin.cookie })).data;
assert.equal(incrementalChat.messages.length, 100);
assert.equal(incrementalChat.messages[0].message, 'Histórico 0');
const failedHelp = (await request('/api/help', { cookie: owner.cookie, method: 'POST', body: { room: '205', message: 'WEBHOOK_FAIL', clientId: 'failed-webhook' } })).data.ticket;
assert.equal(failedHelp.webhookStatus, 'failed');
assert.equal((await request(`/api/help/${failedHelp.id}`, { cookie: admin.cookie })).data.messages[0].message, 'WEBHOOK_FAIL');
assert.equal((await request('/api/help', { cookie: invited.cookie })).data.tickets.some(t => t.id === failedHelp.id), false);

const first = await connect(room.id, owner.cookie);
assert.equal((await first.inbox.next('state:init')).state, null);
const second = await connect(room.id, invited.cookie);
assert.equal((await second.inbox.next('state:init')).state, null);
assert.equal((await first.inbox.next('presence')).count >= 1, true);
assert.equal((await first.inbox.next('presence')).count, 2);

// Projector navigation follows one connection without changing shared state.
const projectorViewer = await connect(`${room.id}&mode=viewer`, owner.cookie);
assert.equal((await projectorViewer.inbox.next('state:init')).projector, null);
first.socket.send(JSON.stringify({ type: 'projector:select', enabled: true, tab: 'vote', speechMode: 'gsl' }));
const selectedProjector = (await projectorViewer.inbox.next('projector:state')).projector;
assert.equal(selectedProjector.tab, 'vote');
assert.equal(selectedProjector.name, owner.user.name);
second.socket.send(JSON.stringify({ type: 'projector:tab', tab: 'mod', speechMode: 'mod' }));
first.socket.send(JSON.stringify({ type: 'projector:tab', tab: 'presence', speechMode: 'gsl' }));
assert.equal((await projectorViewer.inbox.next('projector:state')).projector.tab, 'presence');
const lateViewer = await connect(`${room.id}&mode=viewer`, owner.cookie);
assert.equal((await lateViewer.inbox.next('state:init')).projector.tab, 'presence');
lateViewer.socket.close();
projectorViewer.socket.send(JSON.stringify({ type: 'projector:select', enabled: true, tab: 'mod', speechMode: 'mod' }));
assert.match((await projectorViewer.inbox.next('error')).message, /espectador/);
second.socket.send(JSON.stringify({ type: 'projector:select', enabled: true, tab: 'solo', speechMode: 'solo' }));
assert.equal((await projectorViewer.inbox.next('projector:state')).projector.name, invited.user.name);
second.socket.send(JSON.stringify({ type: 'projector:select', enabled: false }));
assert.equal((await projectorViewer.inbox.next('projector:state')).projector, null);
const temporaryPresenter = await connect(room.id, owner.cookie);
await temporaryPresenter.inbox.next('state:init');
temporaryPresenter.socket.send(JSON.stringify({ type: 'projector:select', enabled: true, tab: 'notes', speechMode: 'gsl' }));
assert.equal((await projectorViewer.inbox.next('projector:state')).projector.tab, 'notes');
temporaryPresenter.socket.close();
assert.equal((await projectorViewer.inbox.next('projector:state')).projector, null);
assert.equal((await request(`/api/rooms/${room.id}/state`, { cookie: owner.cookie })).data.version, 0);
projectorViewer.socket.close();

const state1 = {
  config: { conference: 'SimSD 2026', committee: 'UNESCO', session: 'Sessão integrada' },
  committeeCountries: [{ c: 'Brasil' }, { c: 'França' }],
  presence: { Brasil: 'presente-votante', França: 'presente' },
  speeches: { Brasil: 2, França: 1 }, speakTime: { Brasil: 90, França: 30 },
  motions: [{ id: 'm1', status: 'approved' }], voteHistory: [{ id: 'v1' }], agenda: 'IA na educação',
  notes: [
    { id: 'n1', type: 'general', text: 'Observação geral', createdAt: '2026-09-16T02:59:59Z', participant: null, speech: null },
    { id: 'n2', type: 'delegation', text: 'Boa participação', createdAt: '2026-09-16T03:00:00Z', participant: 'Brasil', speech: null },
    { id: 'n3', type: 'speech', text: 'Argumentação clara', ratings: { diplomacy: 4 }, createdAt: new Date().toISOString(), participant: 'França', speech: { mode: 'gsl', position: 2, remainingSeconds: 30 } },
  ],
};
first.socket.send(JSON.stringify({ type: 'state:update', state: state1, baseVersion: 0 }));
assert.equal((await first.inbox.next('state:ack')).version, 1);
assert.deepEqual((await second.inbox.next('state:update')).state, state1);

const state2 = { ...state1, agenda: 'Agenda sincronizada', speeches: { Brasil: 3, França: 1 } };
second.socket.send(JSON.stringify({ type: 'state:update', state: state2, baseVersion: 1 }));
assert.equal((await second.inbox.next('state:ack')).version, 2);
assert.equal((await first.inbox.next('state:update')).state.agenda, 'Agenda sincronizada');
// Invalid snapshots cannot replace the last valid state or increment its version.
for (const state of [null, [], 'invalid', { notes: {} }, { notes: [null] }, { events: 'invalid' }, { config: [] }, { agenda: 'á'.repeat(1_000_001) }]) {
  first.socket.send(JSON.stringify({ type: 'state:update', state, baseVersion: 2, requestId: 'invalid-state' }));
  assert.equal((await first.inbox.next('error')).requestId, 'invalid-state');
}
first.socket.send(JSON.stringify({ type: 'state:request', requestId: 'snapshot-check' }));
const snapshotCheck = await first.inbox.next('state:snapshot');
assert.equal(snapshotCheck.requestId, 'snapshot-check');
assert.equal(snapshotCheck.version, 2);
assert.deepEqual(snapshotCheck.state, state2);

// A ws frame exceeding maxPayload must close only that connection, not Node.
const oversized = await connect(room.id, owner.cookie);
await oversized.inbox.next('state:init');
const oversizedClosed = new Promise(resolve => oversized.socket.once('close', resolve));
oversized.socket.send('x'.repeat(2_500_001));
await oversizedClosed;
await request('/api/config');
assert.equal((await request(`/api/rooms/${room.id}/state`, { cookie: owner.cookie })).data.version, 2);

const expiredUser = await login('simsd_tools', 'Logout Socket');
const expired = await connect(room.id, expiredUser.cookie);
await expired.inbox.next('state:init');
await request('/api/logout', { cookie: expiredUser.cookie, method: 'POST' });
const expiredClosed = new Promise(resolve => expired.socket.once('close', resolve));
expired.socket.send(JSON.stringify({ type: 'state:update', state: {}, baseVersion: 2 }));
assert.match((await expired.inbox.next('error')).message, /expirou/);
await expiredClosed;
const centralNotes = (await request('/api/general-notes?committeeKey=unesco', { cookie: tools.cookie })).data.notes;
assert.equal(centralNotes.length, 4);
assert.equal(centralNotes.filter(note => note.source === 'session').length, 3);
assert.equal(centralNotes.find(note => note.participant === 'França').ratings.diplomacy, 4);
assert.equal(centralNotes.find(note => note.source === 'session').canEdit, true);
assert.equal((await request('/api/general-notes?source=session', { cookie: tools.cookie })).data.notes.length, 3);
assert.equal((await request('/api/general-notes/export?format=json&source=session', { cookie: tools.cookie })).data.notes.length, 3);
await request('/api/general-notes?day=2026-02-30', { cookie: tools.cookie, expected: 400 });
const dayNotes = (await request('/api/general-notes?source=session&day=2026-09-15', { cookie: tools.cookie })).data.notes;
assert.ok(dayNotes.some(note => note.id.endsWith(':n1')));
assert.ok(!dayNotes.some(note => note.id.endsWith(':n2')));
const dayExport = (await request('/api/general-notes/export?format=json&source=session&day=2026-09-15', { cookie: tools.cookie })).data;
assert.deepEqual(dayExport.notes.map(note => note.id), dayNotes.map(note => note.id));
assert.equal(dayExport.sessions.length, 1);
assert.deepEqual(dayExport.sessions[0].state.notes.map(note => note.id), dayNotes.map(note => note.id.split(':').at(-1)));
const combinedXml = await (await fetch(`${base}/api/general-notes/export?source=session&day=2026-09-15`, { headers: { Cookie: tools.cookie } })).text();
assert.match(combinedXml, /<sessions count="1">/);
assert.doesNotMatch(combinedXml, /type="motion.legacy"/);
assert.doesNotMatch(combinedXml, /type="vote.legacy"/);
assert.doesNotMatch(combinedXml, /Boa participação/);
assert.equal((combinedXml.match(/<\?xml/g) || []).length, 1);
const sessionList = (await request(`/api/general-notes?roomId=${room.id}`, { cookie: tools.cookie })).data;
assert.ok(sessionList.sessions.some(session => session.id === room.id));
assert.equal(sessionList.notes.length, 3);
assert.ok(sessionList.notes.every(note => note.session.roomId === room.id));
assert.equal((await request('/api/general-notes?roomId=missing', { cookie: tools.cookie })).data.notes.length, 0);
const selectedSessionExport = (await request(`/api/general-notes/export?format=json&roomId=${room.id}&delegation=Brasil`, { cookie: tools.cookie })).data;
assert.equal(selectedSessionExport.notes.length, 1);
assert.equal(selectedSessionExport.sessions.length, 1);
assert.deepEqual(selectedSessionExport.sessions[0].state.notes.map(note => note.participant), ['Brasil']);

first.socket.send(JSON.stringify({ type: 'state:update', state: state1, baseVersion: 1 }));
const conflict = await first.inbox.next('state:conflict');
assert.equal(conflict.version, 2);
assert.equal(conflict.state.agenda, 'Agenda sincronizada');

const partialPayload = (await request(`/api/admin/rooms/${room.id}/report?type=partial`, { cookie: admin.cookie })).data;
const partial = partialPayload.report;
assert.equal(partial.type, 'partial');
assert.equal(partialPayload.state.agenda, 'Agenda sincronizada');
assert.equal(partialPayload.room.status, 'open');
assert.equal(partial.summary.participants, 2);
assert.equal(partial.summary.speeches, 4);
assert.equal(partial.summary.totalSpeakingSeconds, 120);
assert.deepEqual(partial.notes, state1.notes);
await request(`/api/admin/rooms/${room.id}/llm-report`, { expected: 401 });
await request(`/api/admin/rooms/${room.id}/llm-report`, { cookie: owner.cookie, expected: 403 });
await request(`/api/admin/rooms/${room.id}/llm-report`, { cookie: invited.cookie, expected: 403 });
const llmResponse = await fetch(`${base}/api/admin/rooms/${room.id}/llm-report`, { headers: { Cookie: admin.cookie } });
assert.equal(llmResponse.status, 200);
assert.match(llmResponse.headers.get('content-type'), /application\/xml/);
assert.match(llmResponse.headers.get('content-disposition'), /attachment; filename="relatorio-avaliativo-llm-.*\.xml"/);
const llmXml = await llmResponse.text();
assert.ok(llmXml.indexOf('<session_data>') < llmXml.indexOf('<notes '));
for (const note of state1.notes) assert.ok(llmXml.includes(note.text));
await request(`/api/rooms/${room.id}/close`, { cookie: invited.cookie, method: 'POST', body: {}, expected: 403 });

const finalState = { ...state2, sessionEnded: true, speeches: { Brasil: 4, França: 1 } };
await request(`/api/rooms/${room.id}/close`, { cookie: owner.cookie, method: 'POST', body: { state: [], baseVersion: 2 }, expected: 400 });
await request(`/api/rooms/${room.id}/close`, { cookie: owner.cookie, method: 'POST', body: { state: state1, baseVersion: 1 }, expected: 409 });
const closed = (await request(`/api/rooms/${room.id}/close`, {
  cookie: owner.cookie, method: 'POST', body: { state: finalState, baseVersion: 2 },
})).data.report;
assert.equal(closed.type, 'final');
assert.equal(closed.summary.speeches, 5);
assert.equal((await first.inbox.next('room:closed')).report.summary.speeches, 5);

const finalPayload = (await request(`/api/admin/rooms/${room.id}/report?type=final`, { cookie: admin.cookie })).data;
const final = finalPayload.report;
assert.equal(final.summary.speeches, 5);
assert.equal(finalPayload.state.sessionEnded, true);
assert.equal(finalPayload.room.status, 'closed');
assert.equal((await request('/api/general-notes?source=session', { cookie: tools.cookie })).data.notes.length, 3);
assert.deepEqual(final.notes, state1.notes);
const closedNote = (await request('/api/general-notes?source=session', { cookie: admin.cookie })).data.notes[0];
assert.equal(closedNote.canEdit, false);
await request(`/api/general-notes/${encodeURIComponent(closedNote.id)}`, { cookie: admin.cookie, method: 'DELETE', body: { version: closedNote.version }, expected: 403 });
// Closed rooms remain readable, but neither WebSocket nor repeated close can write.
first.socket.send(JSON.stringify({ type: 'state:update', state: state1, baseVersion: 3 }));
assert.match((await first.inbox.next('error')).message, /encerrada/);
await request(`/api/rooms/${room.id}/close`, { cookie: owner.cookie, method: 'POST', body: { state: state1 } });
assert.deepEqual((await request(`/api/rooms/${room.id}/state`, { cookie: invited.cookie })).data.state, finalPayload.state);
assert.equal(finalPayload.state.events.at(-1).type, 'session.closed');
await request(`/api/rooms/${room.id}/members`, { cookie: owner.cookie, method: 'POST', body: { identifier: outsider.user.email }, expected: 409 });
assert.equal((await request('/api/rooms', { cookie: tools.cookie })).data.rooms.some(item => item.id === room.id), false);
assert.equal((await request('/api/rooms', { cookie: invited.cookie })).data.rooms.some(item => item.id === room.id), true);

await request(`/api/rooms/${room.id}/reopen`, { cookie: owner.cookie, method: 'POST', expected: 403 });
const reopened = (await request(`/api/rooms/${room.id}/reopen`, { cookie: admin.cookie, method: 'POST' })).data.room;
assert.equal(reopened.status, 'open');
assert.equal(reopened.endedAt, null);
const reopenedEvent = await first.inbox.next('room:reopened');
assert.equal(reopenedEvent.state.sessionEnded, false);
assert.deepEqual(reopenedEvent.state.notes, state1.notes);
await second.inbox.next('room:reopened');
const resumedState = { ...reopenedEvent.state, agenda: 'Sessão retomada' };
first.socket.send(JSON.stringify({ type: 'state:update', state: resumedState, baseVersion: reopenedEvent.version }));
assert.equal((await first.inbox.next('state:ack')).version, reopenedEvent.version + 1);
assert.equal((await second.inbox.next('state:update')).state.agenda, resumedState.agenda);
const reclosed = (await request(`/api/rooms/${room.id}/close`, { cookie: admin.cookie, method: 'POST', body: {} })).data.report;
assert.equal(reclosed.session.agenda, resumedState.agenda);
assert.deepEqual(reclosed.notes, state1.notes);
const finalXml = await (await fetch(`${base}/api/admin/rooms/${room.id}/llm-report`, { headers: { Cookie: admin.cookie } })).text();
assert.match(finalXml, /type="session.reopened"/);
assert.equal((finalXml.match(/type="session.closed"/g) || []).length, 2);

// Rubric routes enforce staff access and only consolidate explicitly chosen rooms.
await request('/api/rubrics/options', { expected: 401 });
for (const path of ['options', 'preview', 'export']) await request(`/api/rubrics/${path}`, { cookie: invited.cookie, method: path === 'options' ? 'GET' : 'POST', body: path === 'options' ? undefined : {}, expected: 403 });
assert.ok((await request('/api/rubrics/options', { cookie: tools.cookie })).data.sessions.some(session => session.id === room.id && session.status === 'closed'));
const rubricSelection = { committeeKeys: ['unesco'], roomIds: [room.id], priority: 'highest', includeGeneral: true, includeUnassessed: false };
const rubricPreview = (await request('/api/rubrics/preview', { cookie: tools.cookie, method: 'POST', body: rubricSelection })).data.report;
assert.equal(rubricPreview.delegationCount, 2);
assert.equal(rubricPreview.comites[0].delegacoes.find(item => item.nome === 'Brasil').dpo_formatacao, 'A');
assert.equal(rubricPreview.comites[0].delegacoes.find(item => item.nome === 'França').ratings.diplomacy, 4);
const rubricExportBody = { ...rubricSelection, fingerprint: rubricPreview.fingerprint, finals: { 'unesco:Brasil': 'Participação consistente' }, format: 'json' };
const rubricJson = (await request('/api/rubrics/export', { cookie: tools.cookie, method: 'POST', body: rubricExportBody })).data;
assert.equal(rubricJson.comites[0].delegacoes.find(item => item.nome === 'Brasil').avaliacao_final, 'Participação consistente');
const rubricDocxResponse = await fetch(`${base}/api/rubrics/export`, { method: 'POST', headers: { Cookie: tools.cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...rubricExportBody, format: 'docx' }) });
assert.equal(rubricDocxResponse.status, 200);
assert.match(rubricDocxResponse.headers.get('content-type'), /wordprocessingml/);
assert.equal(Buffer.from(await rubricDocxResponse.arrayBuffer()).subarray(0, 2).toString(), 'PK');
await request('/api/rubrics/export', { cookie: tools.cookie, method: 'POST', body: { ...rubricExportBody, fingerprint: 'outdated' }, expected: 409 });
await request('/api/rubrics/export', { cookie: tools.cookie, method: 'POST', body: { ...rubricExportBody, committeeKey: 'oea' }, expected: 400 });
await request('/api/rubrics/preview', { cookie: tools.cookie, method: 'POST', body: { ...rubricSelection, roomIds: ['missing'] }, expected: 400 });
await request('/api/rubrics/preview', { cookie: tools.cookie, method: 'POST', body: { ...rubricSelection, roomIds: [], includeGeneral: false }, expected: 400 });

first.socket.close();
second.socket.close();

// Test admin room deletion
await request(`/api/admin/rooms/${room.id}`, { cookie: invited.cookie, method: 'DELETE', expected: 403 });
await request(`/api/admin/rooms/${room.id}`, { cookie: admin.cookie, method: 'DELETE', expected: 200 });
assert.equal((await request('/api/admin/rooms', { cookie: admin.cookie })).data.rooms.some(item => item.id === room.id), false);
assert.equal((await request('/api/general-notes?source=general', { cookie: tools.cookie })).data.notes.length, 2);

// Deletion enforces ownership, staff access and optimistic concurrency.
await request(`/api/general-notes/${generalNote.id}`, { cookie: invited.cookie, method: 'DELETE', body: { version: 2 }, expected: 403 });
await request(`/api/general-notes/${generalNote.id}`, { cookie: owner.cookie, method: 'DELETE', body: { version: 2 }, expected: 403 });
await request(`/api/general-notes/${generalNote.id}`, { cookie: tools.cookie, method: 'DELETE', body: { version: 1 }, expected: 409 });
await request(`/api/general-notes/${generalNote.id}`, { cookie: tools.cookie, method: 'DELETE', body: { version: 2 } });
await request(`/api/general-notes/${generalNote.id}`, { cookie: admin.cookie, method: 'DELETE', body: { version: 2 }, expected: 404 });

const editRoom = (await request('/api/rooms', { cookie: owner.cookie, method: 'POST', body: { name: 'Notas editáveis', committeeKey: 'unesco' }, expected: 201 })).data.room;
const editor = await connect(editRoom.id, owner.cookie);
await editor.inbox.next('state:init');
editor.socket.send(JSON.stringify({ type: 'state:update', baseVersion: 0, state: state1 }));
await editor.inbox.next('state:ack');
const notePath = `/api/general-notes/${encodeURIComponent(`session:${editRoom.id}:n3`)}`;
await request(notePath, { cookie: invited.cookie, method: 'PATCH', body: { version: 1, text: 'Proibido' }, expected: 403 });
await request(notePath, { cookie: tools.cookie, method: 'PATCH', body: { version: 1, text: '', ratings: {} }, expected: 400 });
await request(notePath, { cookie: tools.cookie, method: 'PATCH', body: { version: 1, text: 'Discurso revisado', ratings: { diplomacy: 5 } } });
const noteUpdate = await editor.inbox.next('state:update');
assert.equal(noteUpdate.version, 2);
assert.equal(noteUpdate.state.notes[2].text, 'Discurso revisado');
assert.deepEqual(noteUpdate.state.notes[2].speech, state1.notes[2].speech);
assert.equal(noteUpdate.state.notes[2].createdAt, state1.notes[2].createdAt);
assert.equal(noteUpdate.state.events.at(-1).type, 'note.updated');
const beforeDeletionSelection = { ...rubricSelection, includeGeneral: false, roomIds: [editRoom.id] };
const beforeDeletionRubrics = (await request('/api/rubrics/preview', { cookie: tools.cookie, method: 'POST', body: beforeDeletionSelection })).data.report;
await request(notePath, { cookie: tools.cookie, method: 'DELETE', body: { version: 1 }, expected: 409 });
await request(notePath, { cookie: tools.cookie, method: 'DELETE', body: { version: 2 } });
const noteDelete = await editor.inbox.next('state:update');
assert.equal(noteDelete.version, 3);
assert.equal(noteDelete.state.notes.length, 2);
assert.equal(noteDelete.state.events.at(-1).type, 'note.deleted');
await request('/api/rubrics/export', { cookie: tools.cookie, method: 'POST', body: { ...beforeDeletionSelection, fingerprint: beforeDeletionRubrics.fingerprint, format: 'docx' }, expected: 409 });
const remaining = (await request('/api/general-notes/export?format=json&source=session', { cookie: tools.cookie })).data;
assert.ok(!remaining.notes.some(note => note.id === `session:${editRoom.id}:n3`));
editor.socket.close();
await request(`/api/admin/rooms/${editRoom.id}`, { cookie: admin.cookie, method: 'DELETE' });

// Exercise the browser sync client against real authenticated WebSockets.
globalThis.window = { SimSDController: { setRoomContext() {}, setReadOnly() {}, applyRemoteState() {} } };
globalThis.location = { protocol: new URL(base).protocol, host: new URL(base).host };
const outbox = new Map();
globalThis.localStorage = { getItem: key => outbox.get(key) || null, setItem: (key, value) => outbox.set(key, value), removeItem: key => outbox.delete(key) };
globalThis.WebSocket = class extends WebSocket { constructor(url) { super(url, { headers: { Cookie: owner.cookie } }); } };
const { SessionSync } = await import('../src/sessionSync.js');
const sync = new SessionSync();
const offlineRoom = (await request('/api/rooms', { cookie: owner.cookie, method: 'POST', body: { name: 'Reconexão real', committeeKey: 'unesco' }, expected: 201 })).data.room;
const remoteWriter = await connect(offlineRoom.id, owner.cookie);
await remoteWriter.inbox.next('state:init');
const baseline = { notes: [], events: [], agenda: 'Original' };
remoteWriter.socket.send(JSON.stringify({ type: 'state:update', baseVersion: 0, state: baseline }));
await remoteWriter.inbox.next('state:ack');
function waitSync(predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { unsubscribe(); reject(new Error('Timeout aguardando sincronização real')); }, 5000);
    const unsubscribe = sync.subscribe(event => { if (predicate(event)) { clearTimeout(timer); unsubscribe(); resolve(event); } });
  });
}
try {
  const connected = waitSync(event => event.type === 'status' && event.status === 'connected');
  sync.open(offlineRoom, { userId: owner.user.id }); await connected;
  const disconnected = waitSync(event => event.type === 'status' && event.status === 'disconnected');
  sync.socket.terminate(); await disconnected;
  sync.pushState({ ...baseline, notes: [{ id: 'offline-note', text: 'Escrita sem conexão' }], events: [{ id: 'offline-event', type: 'note.added' }] }, true);
  remoteWriter.socket.send(JSON.stringify({ type: 'state:update', baseVersion: 1, state: { ...baseline, agenda: 'Agenda remota', notes: [{ id: 'remote-note', text: 'Escrita online' }], events: [{ id: 'remote-event', type: 'note.added' }] } }));
  await remoteWriter.inbox.next('state:ack');
  await waitSync(event => event.type === 'saved');
  const actual = (await request(`/api/rooms/${offlineRoom.id}/state`, { cookie: owner.cookie })).data;
  assert.equal(actual.version, 3);
  assert.deepEqual(actual.state.notes.map(note => note.id).sort(), ['offline-note', 'remote-note']);
  assert.equal(actual.state.events.length, 2); assert.equal(actual.state.agenda, 'Agenda remota');
  assert.equal(outbox.size, 0);
} finally { sync.close(); remoteWriter.socket.close(); }
await request(`/api/admin/rooms/${offlineRoom.id}`, { cookie: admin.cookie, method: 'DELETE' });

// Administrative recovery uses the original room and refuses stale previews.
const recoveryRoom = (await request('/api/rooms', { cookie: owner.cookie, method: 'POST', body: { name: 'Importação de pendências', committeeKey: 'unesco' }, expected: 201 })).data.room;
const recoverySocket = await connect(recoveryRoom.id, owner.cookie);
await recoverySocket.inbox.next('state:init');
const recoveryBase = { committeeKey: 'unesco', notes: [{ id: 'n', text: 'Original' }], events: [] };
recoverySocket.socket.send(JSON.stringify({ type: 'state:update', baseVersion: 0, state: recoveryBase }));
await recoverySocket.inbox.next('state:ack');
const backup = { room: recoveryRoom, baseState: recoveryBase, state: { ...recoveryBase, notes: [{ id: 'n', text: 'Arquivo' }, { id: 'offline', text: 'Recuperada' }] } };
const previewPath = '/api/admin/pending-import/preview';
const applyPath = '/api/admin/pending-import/apply';
await request(previewPath, { method: 'POST', body: { backup }, expected: 401 });
await request(previewPath, { cookie: tools.cookie, method: 'POST', body: { backup }, expected: 403 });
await request(applyPath, { cookie: tools.cookie, method: 'POST', body: { backup }, expected: 403 });
await request(previewPath, { cookie: admin.cookie, method: 'POST', body: { backup: {} }, expected: 400 });
await request(previewPath, { cookie: admin.cookie, method: 'POST', body: { backup: { ...backup, state: { notes: null } } }, expected: 400 });
await request(previewPath, { cookie: admin.cookie, method: 'POST', body: { backup: { ...backup, state: { ...backup.state, committeeKey: 'oea' } } }, expected: 400 });
const firstPreview = (await request(previewPath, { cookie: admin.cookie, method: 'POST', body: { backup } })).data;
assert.equal(firstPreview.counts.notesAfter, 2);
assert.equal(firstPreview.conflicts.length, 0);
assert.equal((await request(`/api/rooms/${recoveryRoom.id}/state`, { cookie: admin.cookie })).data.version, 1);
recoverySocket.socket.send(JSON.stringify({ type: 'state:update', baseVersion: 1, state: { ...recoveryBase, notes: [{ id: 'n', text: 'Sala' }, { id: 'online', text: 'Atual' }] } }));
await recoverySocket.inbox.next('state:ack');
await request(applyPath, { cookie: admin.cookie, method: 'POST', body: { backup, token: firstPreview.token, preference: 'local' }, expected: 409 });
const reviewed = (await request(previewPath, { cookie: admin.cookie, method: 'POST', body: { backup } })).data;
assert.equal(reviewed.conflicts[0].path, 'notes.n.text');
await request(applyPath, { cookie: admin.cookie, method: 'POST', body: { backup, token: reviewed.token }, expected: 409 });
await request(applyPath, { cookie: admin.cookie, method: 'POST', body: { backup, token: reviewed.token, preference: 'remote' } });
const recovered = await recoverySocket.inbox.next('state:update');
assert.equal(recovered.version, 3);
assert.equal(recovered.state.notes.find(note => note.id === 'n').text, 'Sala');
assert.deepEqual(recovered.state.notes.map(note => note.id).sort(), ['n', 'offline', 'online']);
assert.equal(recovered.state.events.at(-1).type, 'session.pending_imported');
await request(`/api/rooms/${recoveryRoom.id}/close`, { cookie: admin.cookie, method: 'POST', body: {} });
await request(previewPath, { cookie: admin.cookie, method: 'POST', body: { backup }, expected: 409 });
recoverySocket.socket.close();
await request(`/api/admin/rooms/${recoveryRoom.id}`, { cookie: admin.cookie, method: 'DELETE' });
await request(previewPath, { cookie: admin.cookie, method: 'POST', body: { backup }, expected: 404 });

// Real protocol: partial writes retain history, viewers receive compact clocks,
// stale/malformed writes cannot overwrite state, and heartbeat works read-only.
const clockRoom = (await request('/api/rooms', { cookie: owner.cookie, method: 'POST', body: { name: 'Projector resilience', committeeKey: 'unesco' }, expected: 201 })).data.room;
const clockWriter = await connect(clockRoom.id, owner.cookie);
assert.equal((await clockWriter.inbox.next('state:init')).capabilities.patches, true);
const clockState = { notes: [{ id: 'keep', text: 'history'.repeat(20000) }], events: [], timer: { sec: 60, total: 60, playback: { running: true, deadlines: { sec: Date.now() + 60000 } } } };
clockWriter.socket.send(JSON.stringify({ type: 'state:update', baseVersion: 0, state: clockState }));
await clockWriter.inbox.next('state:ack');
const clockViewer = await connect(`${clockRoom.id}&mode=viewer`, owner.cookie);
const initialClock = await clockViewer.inbox.next('state:init');
assert.equal(initialClock.state.notes, undefined);
assert.equal(initialClock.state.timer.playback.running, true);
clockViewer.socket.send(JSON.stringify({ type: 'sync:ping', id: 'viewer-ping' }));
const pong = await clockViewer.inbox.next('sync:pong');
assert.equal(pong.id, 'viewer-ping'); assert.ok(Number.isFinite(pong.serverTime));
clockWriter.socket.send(JSON.stringify({ type: 'state:patch', baseVersion: 1, requestId: 'clock-patch', patch: { set: { timer: { sec: 55, total: 60, playback: { running: false } } }, remove: [] } }));
assert.equal((await clockWriter.inbox.next('state:ack')).requestId, 'clock-patch');
const pausedClock = await clockViewer.inbox.next('state:update');
assert.equal(pausedClock.state.timer.playback.running, false);
assert.equal(pausedClock.state.notes, undefined);
assert.ok(JSON.stringify(pausedClock).length < 1000);
assert.equal((await request(`/api/rooms/${clockRoom.id}/state`, { cookie: owner.cookie })).data.state.notes[0].text, clockState.notes[0].text);
clockWriter.socket.send(JSON.stringify({ type: 'state:patch', baseVersion: 1, patch: { set: { notes: [] }, remove: [] } }));
assert.equal((await clockWriter.inbox.next('state:conflict')).version, 2);
clockWriter.socket.send(JSON.stringify({ type: 'state:patch', baseVersion: 2, patch: { set: { notes: 'invalid' }, remove: [] } }));
assert.match((await clockWriter.inbox.next('error')).message, /inválido/);
clockViewer.socket.send(JSON.stringify({ type: 'state:patch', baseVersion: 2, patch: { set: {}, remove: [] } }));
assert.match((await clockViewer.inbox.next('error')).message, /espectador/);
// Closing between checkpoints materializes elapsed time and clears playback.
clockWriter.socket.send(JSON.stringify({ type: 'state:patch', baseVersion: 2, patch: { set: { timer: { sec: 60, playback: { running: true, deadlines: { sec: Date.now() + 20000 } } } }, remove: [] } }));
await clockWriter.inbox.next('state:ack');
await request(`/api/rooms/${clockRoom.id}/close`, { cookie: owner.cookie, method: 'POST', body: {} });
const closedClock = await clockViewer.inbox.next('room:closed');
assert.equal(closedClock.state.timer.playback.running, false);
assert.ok(closedClock.state.timer.sec <= 20);
assert.equal(closedClock.report, undefined);
clockViewer.socket.close(); clockWriter.socket.close();
await request(`/api/admin/rooms/${clockRoom.id}`, { cookie: admin.cookie, method: 'DELETE' });

console.log('Integration suite passed: auth roles, room ACL, WebSocket recovery/projector/patches/heartbeat, notes/reports, administrative pending imports.');
