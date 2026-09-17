import { randomUUID } from 'node:crypto';
import { db, nowIso } from './database.js';
import { sendHelpRequest } from './helpRequests.js';

const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
function text(value, max, label) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(`${label}: informe de 1 a ${max} caracteres.`);
  return value.trim();
}
function canRead(ticket, user) {
  return user.role === 'admin' || ticket.created_by === user.id || Boolean(ticket.room_id && db.prepare(`SELECT 1 FROM rooms r WHERE r.id=? AND
    (r.owner_user_id=? OR EXISTS(SELECT 1 FROM room_members m WHERE m.room_id=r.id AND m.user_id=?))`).get(ticket.room_id, user.id, user.id));
}
function ticketFor(id, user) {
  const ticket = db.prepare('SELECT * FROM help_tickets WHERE id=?').get(id);
  if (!ticket || !canRead(ticket, user)) fail('Chamado não encontrado ou acesso negado.', 404);
  return ticket;
}
function summary(ticket, user) {
  const last = db.prepare('SELECT * FROM help_messages WHERE ticket_id=? ORDER BY id DESC LIMIT 1').get(ticket.id);
  const unread = db.prepare(`SELECT count(*) total FROM help_messages WHERE ticket_id=? AND sender_id<>? AND id>
    COALESCE((SELECT message_id FROM help_reads WHERE ticket_id=? AND user_id=?),0)`).get(ticket.id, user.id, ticket.id, user.id).total;
  return { id: ticket.id, roomId: ticket.room_id, room: ticket.room_label, roomName: ticket.room_name,
    status: ticket.status, webhookStatus: ticket.webhook_status, createdAt: ticket.created_at, updatedAt: ticket.updated_at,
    unread, lastMessage: last?.message || '', lastMessageId: last?.id || 0 };
}
const publicMessage = row => ({ id: row.id, senderId: row.sender_id, senderName: row.sender_name, admin: row.sender_role === 'admin', message: row.message, createdAt: row.created_at });
function insertMessage(ticketId, user, message, clientId) {
  db.prepare('INSERT INTO help_messages(ticket_id,sender_id,sender_name,sender_role,client_id,message,created_at) VALUES(?,?,?,?,?,?,?)')
    .run(ticketId, user.id, user.name, user.role, clientId, message, nowIso());
}

export async function createHelpTicket(input, user, room) {
  const roomLabel = text(input?.room, 80, 'Sala');
  const message = text(input?.message, 1000, 'Mensagem');
  const clientId = input.clientId === undefined ? randomUUID() : text(input.clientId, 100, 'Identificador');
  const previous = db.prepare('SELECT * FROM help_tickets WHERE created_by=? AND client_id=?').get(user.id, clientId);
  if (previous) return { ok: true, ticket: summary(ticketFor(previous.id, user), user) };
  const id = randomUUID(), now = nowIso();
  db.exec('BEGIN');
  try {
    db.prepare('INSERT INTO help_tickets(id,room_id,room_label,room_name,created_by,client_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)')
      .run(id, room?.id || null, roomLabel, room?.name || null, user.id, clientId, now, now);
    insertMessage(id, user, message, clientId);
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  // Saving the chat is independent of the external notification service.
  let webhookStatus = 'sent';
  try { await sendHelpRequest({ room: roomLabel, message }); } catch { webhookStatus = 'failed'; }
  db.prepare('UPDATE help_tickets SET webhook_status=? WHERE id=?').run(webhookStatus, id);
  return { ok: true, ticket: summary(ticketFor(id, user), user) };
}

export function listHelpTickets(user, roomId) {
  return db.prepare('SELECT * FROM help_tickets ORDER BY updated_at DESC').all()
    .filter(ticket => canRead(ticket, user) && (!roomId || ticket.room_id === roomId))
    .map(ticket => summary(ticket, user));
}
export function getHelpChat(id, user, params) {
  const ticket = ticketFor(id, user);
  const after = Number(params.get('after') || 0), before = Number(params.get('before') || Number.MAX_SAFE_INTEGER);
  if (!Number.isSafeInteger(after) || !Number.isSafeInteger(before) || after < 0 || before < 1) fail('Cursor inválido.');
  const rows = db.prepare(`SELECT * FROM help_messages WHERE ticket_id=? AND id>? AND id<? ORDER BY id ${after ? 'ASC' : 'DESC'} LIMIT 100`).all(id, after, before);
  if (!after) rows.reverse();
  return { ticket: summary(ticket, user), messages: rows.map(publicMessage), hasMore: rows.length === 100 };
}
export function postHelpMessage(id, user, input) {
  const ticket = ticketFor(id, user);
  const clientId = text(input?.clientId, 100, 'Identificador');
  const message = text(input?.message, 2000, 'Mensagem');
  const existing = db.prepare('SELECT * FROM help_messages WHERE ticket_id=? AND sender_id=? AND client_id=?').get(id, user.id, clientId);
  if (existing) return { message: publicMessage(existing) };
  if (ticket.status === 'resolved') fail('Reabra o chamado para enviar uma mensagem.', 409);
  db.exec('BEGIN');
  try {
    insertMessage(id, user, message, clientId);
    db.prepare('UPDATE help_tickets SET updated_at=?,status=? WHERE id=?').run(nowIso(), user.role === 'admin' ? 'active' : ticket.status, id);
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  return { message: publicMessage(db.prepare('SELECT * FROM help_messages WHERE ticket_id=? ORDER BY id DESC LIMIT 1').get(id)) };
}
export function changeHelpStatus(id, user, input) {
  const ticket = ticketFor(id, user);
  if (!['new', 'active', 'resolved'].includes(input?.status)) fail('Status inválido.');
  if (user.role !== 'admin' && !(ticket.status === 'resolved' && input.status === 'new')) fail('Somente administradores podem encerrar ou assumir chamados.', 403);
  db.prepare('UPDATE help_tickets SET status=?,updated_at=? WHERE id=?').run(input.status, nowIso(), id);
  return { ticket: summary(ticketFor(id, user), user) };
}
export function readHelpMessages(id, user, input) {
  ticketFor(id, user);
  if (!Number.isSafeInteger(input?.messageId) || input.messageId < 1 || !db.prepare('SELECT 1 FROM help_messages WHERE ticket_id=? AND id=?').get(id, input.messageId)) fail('Mensagem inválida.');
  db.prepare(`INSERT INTO help_reads(ticket_id,user_id,message_id) VALUES(?,?,?) ON CONFLICT(ticket_id,user_id)
    DO UPDATE SET message_id=MAX(message_id,excluded.message_id)`).run(id, user.id, input.messageId);
  return { ok: true };
}
