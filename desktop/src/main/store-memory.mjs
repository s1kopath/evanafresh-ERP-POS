// In-memory implementation of the local-store interface.
//
// Used by the headless tests so the sync engine can be exercised without the
// native better-sqlite3 module. The Electron build uses store-sqlite.mjs, which
// implements the exact same interface — the sync engine can't tell them apart.
//
// Interface:
//   getKV(key) -> string | null
//   setKV(key, value)
//   setRoster(users[])           // replace the whole roster
//   getRoster() -> users[]
//   enqueue({ uuid, type, payload })   // add to outbox as 'pending'
//   outboxByStatus(status) -> rows[]
//   markOutbox(uuid, status, serverDocNo?)
//   outboxAll() -> rows[]

export function createMemoryStore() {
    const kv = new Map();
    let roster = [];
    const outbox = new Map(); // uuid -> { uuid, type, payload, status, server_doc_no, created_at }

    return {
        getKV: (key) => (kv.has(key) ? kv.get(key) : null),
        setKV: (key, value) => void kv.set(key, value == null ? null : String(value)),

        setRoster: (users) => void (roster = Array.isArray(users) ? users : []),
        getRoster: () => roster,

        enqueue: ({ uuid, type, payload }) =>
            void outbox.set(uuid, { uuid, type, payload, status: 'pending', server_doc_no: null, created_at: Date.now() }),
        outboxByStatus: (status) => [...outbox.values()].filter((r) => r.status === status),
        markOutbox: (uuid, status, serverDocNo = null) => {
            const row = outbox.get(uuid);
            if (row) {
                row.status = status;
                if (serverDocNo) row.server_doc_no = serverDocNo;
            }
        },
        outboxAll: () => [...outbox.values()],
    };
}
