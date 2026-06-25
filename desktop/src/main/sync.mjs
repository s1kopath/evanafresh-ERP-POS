// The sync engine — the heart of offline-first.
//
// It is deliberately storage-agnostic and UI-agnostic: it receives an `api`
// client and a `store` and orchestrates enroll / heartbeat / pull / push. The
// terminal never calls this directly during a sale — it just writes to the local
// store (outbox); this engine drains the outbox whenever the server is reachable.

export function createSyncEngine({ api, store }) {
    async function enroll(input) {
        const { status, json } = await api.enroll({
            email: input.email,
            password: input.password,
            device_uid: input.deviceUid,
            device_name: input.deviceName,
            terminal_id: input.terminalId,
        });

        if (status !== 201) {
            const err = new Error(json.message || 'Enrollment failed.');
            err.detail = json;
            throw err;
        }

        store.setKV('device_token', json.device_token); // → OS keychain in the real app
        store.setKV('device_id', String(json.device_id));
        store.setKV('branch', JSON.stringify(json.branch));
        store.setKV('terminal', JSON.stringify(json.terminal ?? null));
        store.setKV('number_prefix', json.terminal?.number_prefix ?? json.branch.code);
        if (!store.getKV('number_next')) store.setKV('number_next', '1');

        return json;
    }

    async function heartbeat() {
        try {
            const { status, json } = await api.heartbeat();
            if (status === 200) return { online: true, status: json.device_status };
            if (status === 403 && json.device_status === 'revoked') return { online: true, revoked: true };
            return { online: true, error: status };
        } catch (e) {
            if (e.offline) return { online: false };
            throw e;
        }
    }

    async function pull() {
        const { status, json } = await api.pull();
        if (status !== 200) return { ok: false, status };
        store.setRoster(json.roster ?? []);
        store.setKV('cursor', json.cursor ?? '');
        store.setKV('catalogue', JSON.stringify(json.catalogue ?? []));
        return { ok: true, roster: (json.roster ?? []).length };
    }

    // Drain the outbox to the idempotent push endpoint. 'applied' and 'duplicate'
    // both mean "the server has it" → mark synced; only real errors stay unsynced.
    async function flush() {
        const pending = store.outboxByStatus('pending');
        if (!pending.length) return { pushed: 0 };

        const { status, json } = await api.push(
            pending.map((m) => ({ uuid: m.uuid, type: m.type, payload: m.payload })),
        );
        if (status !== 200) return { pushed: 0, error: status };

        for (const r of json.results) {
            if (r.status === 'applied' || r.status === 'duplicate') {
                store.markOutbox(r.uuid, 'synced', r.server_doc_no);
            } else {
                store.markOutbox(r.uuid, 'rejected');
            }
        }
        return { pushed: json.results.length, results: json.results };
    }

    // Called on a timer and on reconnect. Never blocks a sale.
    async function syncNow() {
        const hb = await heartbeat();
        if (hb.revoked) return { online: true, revoked: true };
        if (!hb.online) return { online: false, pending: store.outboxByStatus('pending').length };

        const flushed = await flush();
        const pulled = await pull();
        return { online: true, flushed, pulled, pending: store.outboxByStatus('pending').length };
    }

    return { enroll, heartbeat, pull, flush, syncNow };
}
