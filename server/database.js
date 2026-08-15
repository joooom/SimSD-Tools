import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databasePath = resolve(process.env.SIMSD_DATABASE_PATH || 'data/simsd.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portal_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    login TEXT,
    role TEXT NOT NULL CHECK(role IN ('admin','simsd_tools','student')),
    committee TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS oauth_flows (
    state_hash TEXT PRIMARY KEY,
    verifier TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    committee_key TEXT,
    owner_user_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
    session_state TEXT,
    state_version INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    ended_at TEXT
  );

  CREATE TABLE IF NOT EXISTS room_members (
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_by INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL,
    PRIMARY KEY(room_id,user_id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK(report_type IN ('partial','final')),
    payload TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON app_sessions(expires_at);
  CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members(user_id);
  CREATE INDEX IF NOT EXISTS idx_reports_room ON reports(room_id,created_at);
`);

export function nowIso() {
  return new Date().toISOString();
}

export function cleanupExpired() {
  const now = nowIso();
  db.prepare('DELETE FROM app_sessions WHERE expires_at <= ?').run(now);
  db.prepare('DELETE FROM oauth_flows WHERE expires_at <= ?').run(now);
}

export function upsertPortalUser(profile) {
  const now = nowIso();
  db.prepare(`
    INSERT INTO users(portal_id,name,email,login,role,committee,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?)
    ON CONFLICT(portal_id) DO UPDATE SET
      name=excluded.name,email=excluded.email,login=excluded.login,
      role=excluded.role,committee=excluded.committee,updated_at=excluded.updated_at
  `).run(
    String(profile.id), profile.name || profile.login || 'Usuário SimSD',
    profile.email || null, profile.login || null, profile.role,
    profile.committee || null, now, now,
  );
  return db.prepare('SELECT * FROM users WHERE portal_id = ?').get(String(profile.id));
}

export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    portalId: row.portal_id,
    name: row.name,
    email: row.email,
    login: row.login,
    role: row.role,
    committee: row.committee,
  };
}
