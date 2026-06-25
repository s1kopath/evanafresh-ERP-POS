// The on-device `posApi` facade — the methods the renderer calls over IPC.
// It composes the store + sync engine + offline auth. Every sale is written to
// the local outbox first (local-first); the sync engine drains it in the
// background. The method map keys match what preload/renderer invoke.

import { randomUUID } from 'node:crypto';

export function createPosApi({ store, sync, auth }) {
    function deviceStatus() {
        return {
            enrolled: !!store.getKV('device_token'),
            branch: JSON.parse(store.getKV('branch') || 'null'),
            terminal: JSON.parse(store.getKV('terminal') || 'null'),
            numberPrefix: store.getKV('number_prefix'),
        };
    }

    // Offline-safe document number, drawn from this terminal's reserved range.
    function nextNumber() {
        const prefix = store.getKV('number_prefix') || 'POS';
        const n = parseInt(store.getKV('number_next') || '1', 10);
        store.setKV('number_next', String(n + 1));
        return `${prefix}-${String(n).padStart(6, '0')}`;
    }

    function createSale(sale) {
        const session = auth.session();
        if (!session) {
            const err = new Error('Not logged in.');
            err.code = 'no_session';
            throw err;
        }
        const uuid = randomUUID();
        const number = nextNumber();
        const payload = {
            number,
            cashier_id: session.user_id,
            sold_at: new Date().toISOString(),
            ...sale,
        };
        store.enqueue({ uuid, type: 'sale', payload }); // local-first — never blocks on network
        return { uuid, number };
    }

    function syncStatus() {
        return {
            pending: store.outboxByStatus('pending').length,
            synced: store.outboxByStatus('synced').length,
            cursor: store.getKV('cursor'),
        };
    }

    // method name -> handler (invoked from preload via ipcMain 'pos:invoke')
    return {
        'device.enroll': (p) => sync.enroll(p),
        'device.status': () => deviceStatus(),
        'auth.login': (p) => auth.login(p.pin),
        'auth.session': () => auth.session(),
        'auth.logout': () => auth.logout(),
        'sales.create': (p) => createSale(p),
        'sync.now': () => sync.syncNow(),
        'sync.status': () => syncStatus(),
    };
}
