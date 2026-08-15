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

const owner = await login('student', 'Owner Student');
const invited = await login('student', 'Invited Student');
const outsider = await login('student', 'Outside Student');
const tools = await login('simsd_tools', 'Tools User');
const admin = await login('admin', 'Admin User');

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

const first = await connect(room.id, owner.cookie);
assert.equal((await first.inbox.next('state:init')).state, null);
const second = await connect(room.id, invited.cookie);
assert.equal((await second.inbox.next('state:init')).state, null);
assert.equal((await first.inbox.next('presence')).count >= 1, true);
assert.equal((await first.inbox.next('presence')).count, 2);

const state1 = {
  config: { conference: 'SimSD 2026', committee: 'UNESCO', session: 'Sessão integrada' },
  committeeCountries: [{ c: 'Brasil' }, { c: 'França' }],
  presence: { Brasil: 'presente-votante', França: 'presente' },
  speeches: { Brasil: 2, França: 1 }, speakTime: { Brasil: 90, França: 30 },
  motions: [{ id: 'm1', status: 'approved' }], voteHistory: [{ id: 'v1' }], agenda: 'IA na educação',
};
first.socket.send(JSON.stringify({ type: 'state:update', state: state1, baseVersion: 0 }));
assert.equal((await first.inbox.next('state:ack')).version, 1);
assert.deepEqual((await second.inbox.next('state:update')).state, state1);

const state2 = { ...state1, agenda: 'Agenda sincronizada', speeches: { Brasil: 3, França: 1 } };
second.socket.send(JSON.stringify({ type: 'state:update', state: state2, baseVersion: 1 }));
assert.equal((await second.inbox.next('state:ack')).version, 2);
assert.equal((await first.inbox.next('state:update')).state.agenda, 'Agenda sincronizada');

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
await request(`/api/rooms/${room.id}/close`, { cookie: invited.cookie, method: 'POST', body: {}, expected: 403 });

const finalState = { ...state2, sessionEnded: true, speeches: { Brasil: 4, França: 1 } };
const closed = (await request(`/api/rooms/${room.id}/close`, {
  cookie: owner.cookie, method: 'POST', body: { state: finalState },
})).data.report;
assert.equal(closed.type, 'final');
assert.equal(closed.summary.speeches, 5);
assert.equal((await first.inbox.next('room:closed')).report.summary.speeches, 5);

const finalPayload = (await request(`/api/admin/rooms/${room.id}/report?type=final`, { cookie: admin.cookie })).data;
const final = finalPayload.report;
assert.equal(final.summary.speeches, 5);
assert.equal(finalPayload.state.sessionEnded, true);
assert.equal(finalPayload.room.status, 'closed');
assert.equal((await request('/api/rooms', { cookie: tools.cookie })).data.rooms.some(item => item.id === room.id), false);
assert.equal((await request('/api/rooms', { cookie: invited.cookie })).data.rooms.some(item => item.id === room.id), true);

first.socket.close();
second.socket.close();
console.log('Integration suite passed: auth roles, room ACL, invites, WebSocket sync/conflicts, live/final reports.');
