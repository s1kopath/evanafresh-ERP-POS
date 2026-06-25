// Offline-POS sync harness (headless spike).
//
// Proves the offline round-trip against the live Laravel server using ONLY Node
// built-ins (fetch, crypto, fs) — no Electron, no native modules. A JSON file
// under .localstore/ stands in for the device's encrypted SQLite store.
//
// Flow:  enroll (online) → pull roster → GO OFFLINE: ring a sale into the local
//        outbox → RECONNECT: push → re-push (lost-ack) → verify idempotency.
//
// Run:   node desktop/spike/sync-harness.mjs   (server must be on :8000)

import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASE = process.env.POS_BASE || 'http://127.0.0.1:8000';
const HERE = dirname(fileURLToPath(import.meta.url));
const STORE = join(HERE, '.localstore');

// ---- tiny local "store" (one JSON file = the device's local DB) -------------
const dbPath = join(STORE, 'device.json');
const load = () => (existsSync(dbPath) ? JSON.parse(readFileSync(dbPath, 'utf8')) : {});
const save = (db) => writeFileSync(dbPath, JSON.stringify(db, null, 2));

// ---- output helpers ---------------------------------------------------------
const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const info = (m) => console.log(`  \x1b[36m·\x1b[0m ${m}`);
const step = (m) => console.log(`\n\x1b[1m${m}\x1b[0m`);
const fail = (m) => { console.error(`  \x1b[31m✗ ${m}\x1b[0m`); process.exitCode = 1; };

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function main() {
  // Fresh store each run.
  rmSync(STORE, { recursive: true, force: true });
  mkdirSync(STORE, { recursive: true });
  const db = { device: null, readModel: null, outbox: [], synced: [] };

  console.log(`\n\x1b[1mOffline-POS sync harness\x1b[0m  →  ${BASE}`);

  // 1. ENROLL (online, once) ---------------------------------------------------
  step('1. Enroll device (online)');
  const enroll = await api('/api/pos/devices/enroll', {
    method: 'POST',
    body: {
      email: 'manager@evanafresh.com',
      password: 'password',
      device_uid: `harness-${randomUUID().slice(0, 8)}`,
      device_name: 'Harness Till',
      terminal_id: 1,
    },
  });
  if (enroll.status !== 201) return fail(`enroll failed (${enroll.status}): ${JSON.stringify(enroll.json)}`);
  db.device = { token: enroll.json.device_token, branch: enroll.json.branch, terminal: enroll.json.terminal };
  save(db);
  ok(`enrolled to ${enroll.json.branch.code} / ${enroll.json.terminal.number_prefix}`);
  info(`device token stored locally (stands in for OS keychain)`);

  const token = db.device.token;

  // 2. HEARTBEAT + PULL (online) ----------------------------------------------
  step('2. Heartbeat + pull roster (online)');
  const hb = await api('/api/pos/heartbeat', { token });
  hb.status === 200 && hb.json.ok ? ok('heartbeat ok — server reachable') : fail(`heartbeat ${hb.status}`);

  const pull = await api('/api/pos/sync/pull', { token });
  if (pull.status !== 200) return fail(`pull ${pull.status}`);
  db.readModel = { roster: pull.json.roster, catalogue: pull.json.catalogue, cursor: pull.json.cursor };
  save(db);
  ok(`pulled roster: ${pull.json.roster.length} users (PIN verifiers cached locally)`);
  const cashier = pull.json.roster.find((u) => u.role === 'cashier');
  info(`e.g. ${cashier.name} (${cashier.role}) — permissions: ${cashier.permissions.join(', ')}`);

  // 3. GO OFFLINE: ring a sale into the local outbox ---------------------------
  step('3. \x1b[33m[OFFLINE]\x1b[0m Ring a sale — written to local outbox, no network');
  const uuid = randomUUID();
  const sale = {
    uuid,
    type: 'sale',
    payload: {
      number: `${db.device.terminal.number_prefix}-000001`, // offline-safe local number
      cashier_id: cashier.user_id,
      subtotal_minor: 1850,
      vat_minor: 278,
      total_minor: 2128,
      sold_at: new Date(0).toISOString().replace('1970', '2026'), // fixed stamp (no Date.now drift)
      lines: [
        { name: 'Bananas (1.2kg)', qty: 1.2, unit_price_minor: 700, line_total_minor: 840 },
        { name: 'Laban 1L', barcode: '6281000123457', qty: 2, unit_price_minor: 505, line_total_minor: 1010 },
      ],
      payments: [{ method: 'cash', amount_minor: 2128 }],
    },
  };
  db.outbox.push(sale);
  save(db);
  ok(`sale ${uuid.slice(0, 8)}… queued locally (number ${sale.payload.number}) — cashier sold with no internet`);

  // 4. RECONNECT: flush the outbox --------------------------------------------
  step('4. \x1b[32m[RECONNECT]\x1b[0m Flush outbox → push');
  const push1 = await api('/api/pos/sync/push', { token, method: 'POST', body: { mutations: db.outbox } });
  if (push1.status !== 200) return fail(`push ${push1.status}`);
  const r1 = push1.json.results[0];
  r1.status === 'applied'
    ? ok(`pushed → server applied as ${r1.server_doc_no}`)
    : fail(`expected applied, got ${r1.status}`);
  // mark synced locally
  db.synced.push(...db.outbox);
  db.outbox = [];
  save(db);

  // 5. LOST-ACK RETRY: push the SAME sale again --------------------------------
  step('5. Simulate a lost ack → re-push the same sale');
  const push2 = await api('/api/pos/sync/push', { token, method: 'POST', body: { mutations: db.synced } });
  const r2 = push2.json.results[0];
  r2.status === 'duplicate'
    ? ok(`server returned "duplicate" — idempotent, no second sale`)
    : fail(`expected duplicate, got ${r2.status}`);

  step('Result');
  if (process.exitCode) {
    console.log('  \x1b[31mHarness FAILED\x1b[0m\n');
  } else {
    ok('Offline round-trip verified: enroll → offline sale → sync → idempotent retry');
    info('Local store: ' + dbPath);
    console.log('');
  }
}

main().catch((e) => { fail(e.message); console.error(e); });
