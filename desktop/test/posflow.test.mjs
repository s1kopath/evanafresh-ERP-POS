// Headless test of the Electron client's sync logic, run against the live
// Laravel server with an in-memory store (no Electron, no native modules).
//
//   node --test desktop/test/posflow.test.mjs     (server must be on :8000)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createMemoryStore } from '../src/main/store-memory.mjs';
import { createApiClient } from '../src/main/api-client.mjs';
import { createSyncEngine } from '../src/main/sync.mjs';

const BASE = process.env.POS_BASE || 'http://127.0.0.1:8000';

function makeClient(base = BASE) {
    const store = createMemoryStore();
    const api = createApiClient({ baseUrl: base, getToken: () => store.getKV('device_token') });
    const sync = createSyncEngine({ api, store });
    return { store, api, sync };
}

test('enroll → pull roster → queue offline → sync drains outbox → idempotent re-push', async () => {
    const { store, api, sync } = makeClient();

    const dev = await sync.enroll({
        email: 'manager@evanafresh.com',
        password: 'password',
        deviceUid: `etest-${randomUUID().slice(0, 8)}`,
        deviceName: 'E2E Till',
        terminalId: 1,
    });
    assert.equal(dev.branch.code, 'B1');
    assert.ok(store.getKV('device_token'), 'device token persisted locally');

    const pulled = await sync.pull();
    assert.ok(pulled.roster >= 1, 'roster pulled');
    const cashier = store.getRoster().find((u) => u.role === 'cashier');
    assert.ok(cashier, 'cashier present in cached roster');

    // Ring a sale while "offline": it only touches the local outbox.
    const uuid = randomUUID();
    const number = `${store.getKV('number_prefix')}-000001`;
    store.enqueue({
        uuid,
        type: 'sale',
        payload: {
            number,
            cashier_id: cashier.user_id,
            subtotal_minor: 1000,
            vat_minor: 150,
            total_minor: 1150,
            sold_at: '2026-06-24T10:00:00Z',
            lines: [{ name: 'Apples 1kg', qty: 1, unit_price_minor: 1000, line_total_minor: 1000 }],
            payments: [{ method: 'cash', amount_minor: 1150 }],
        },
    });
    assert.equal(store.outboxByStatus('pending').length, 1);

    // Reconnect → sync drains the outbox.
    const res = await sync.syncNow();
    assert.equal(res.online, true);
    assert.equal(store.outboxByStatus('pending').length, 0, 'outbox drained');
    assert.equal(store.outboxByStatus('synced').length, 1, 'sale marked synced');

    // Lost ack: the same uuid pushed again is a server-side no-op.
    const again = await api.push([{ uuid, type: 'sale', payload: { number } }]);
    assert.equal(again.json.results[0].status, 'duplicate');
});

test('offline: syncNow keeps the outbox pending and never throws', async () => {
    const { store, sync } = makeClient('http://127.0.0.1:59999'); // nothing listening
    store.setKV('device_token', 'x');
    store.setKV('number_prefix', 'B1-T1');
    store.enqueue({ uuid: randomUUID(), type: 'sale', payload: { number: 'B1-T1-000099' } });

    const res = await sync.syncNow();
    assert.equal(res.online, false);
    assert.equal(store.outboxByStatus('pending').length, 1, 'sale retained for later sync');
});
