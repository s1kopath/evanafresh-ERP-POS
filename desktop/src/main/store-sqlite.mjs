// Local-first store backed by SQLite (better-sqlite3). Same interface as
// store-memory.mjs, so the sync engine and pos-api are identical in both.
//
// ENCRYPTION: plain better-sqlite3 is NOT encrypted. For production swap the
// driver for `better-sqlite3-multiple-ciphers` (drop-in) and pass `key` to run
// `PRAGMA key` — see desktop/README.md. The key belongs in the OS keychain
// (Electron safeStorage), never hard-coded.

import Database from 'better-sqlite3';

export function createSqliteStore(dbPath, { key } = {}) {
    const db = new Database(dbPath);
    if (key) {
        // Only effective with a SQLCipher-capable driver; a no-op (or throws) on plain better-sqlite3.
        try { db.pragma(`key='${key.replace(/'/g, "''")}'`); } catch { /* plain build */ }
    }
    db.pragma('journal_mode = WAL');

    db.exec(`
        CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT);
        CREATE TABLE IF NOT EXISTS roster (
            user_id INTEGER PRIMARY KEY, name TEXT, role TEXT,
            permissions TEXT, pos_pin_hash TEXT, status TEXT
        );
        CREATE TABLE IF NOT EXISTS outbox (
            uuid TEXT PRIMARY KEY, type TEXT, payload TEXT,
            status TEXT, server_doc_no TEXT, created_at INTEGER
        );
    `);

    const q = {
        getKV: db.prepare('SELECT value FROM kv WHERE key = ?'),
        setKV: db.prepare('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'),
        clearRoster: db.prepare('DELETE FROM roster'),
        insRoster: db.prepare('INSERT OR REPLACE INTO roster (user_id, name, role, permissions, pos_pin_hash, status) VALUES (@user_id, @name, @role, @permissions, @pos_pin_hash, @status)'),
        allRoster: db.prepare('SELECT * FROM roster'),
        enqueue: db.prepare('INSERT OR IGNORE INTO outbox (uuid, type, payload, status, server_doc_no, created_at) VALUES (@uuid, @type, @payload, @status, NULL, @created_at)'),
        byStatus: db.prepare('SELECT * FROM outbox WHERE status = ? ORDER BY created_at'),
        mark: db.prepare('UPDATE outbox SET status = @status, server_doc_no = @doc WHERE uuid = @uuid'),
        all: db.prepare('SELECT * FROM outbox ORDER BY created_at'),
    };

    const decodeOutbox = (r) => ({ ...r, payload: JSON.parse(r.payload) });

    const replaceRoster = db.transaction((users) => {
        q.clearRoster.run();
        for (const u of users) {
            q.insRoster.run({
                user_id: u.user_id,
                name: u.name,
                role: u.role,
                permissions: JSON.stringify(u.permissions ?? []),
                pos_pin_hash: u.pos_pin_hash ?? null,
                status: u.status ?? 'active',
            });
        }
    });

    return {
        getKV: (key) => q.getKV.get(key)?.value ?? null,
        setKV: (key, value) => void q.setKV.run(key, value == null ? null : String(value)),

        setRoster: (users) => replaceRoster(Array.isArray(users) ? users : []),
        getRoster: () => q.allRoster.all().map((r) => ({ ...r, permissions: JSON.parse(r.permissions || '[]') })),

        enqueue: ({ uuid, type, payload }) =>
            void q.enqueue.run({ uuid, type, payload: JSON.stringify(payload), status: 'pending', created_at: Date.now() }),
        outboxByStatus: (status) => q.byStatus.all(status).map(decodeOutbox),
        markOutbox: (uuid, status, serverDocNo = null) => void q.mark.run({ uuid, status, doc: serverDocNo }),
        outboxAll: () => q.all.all().map(decodeOutbox),
    };
}
