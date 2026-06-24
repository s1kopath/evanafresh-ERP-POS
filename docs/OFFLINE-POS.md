# EIBMS — Offline-First POS: Architecture & Sync Contract

The deep-dive spec for the offline-capable POS terminal (Phase 4b). The
[DEVELOPMENT-PLAN.md](DEVELOPMENT-PLAN.md) Phase 4 section summarizes *what* to build;
this doc is the *how*. It is the reference for the design spike that opens Phase 4b.

> **One-line model:** the POS terminal is a local-first Electron app. It always reads and
> writes a **local encrypted SQLite store**; a background **sync engine** reconciles with the
> Laravel server whenever the server is reachable. There is no "online mode" vs "offline
> mode" — only local-first, with sync running (or not) in the background.

---

## 1. Principle: local-first, single-path

The failure mode to avoid is two code paths — "if internet → server, else → local" — with the
UI switching between them. That duplicates business logic and breeds race conditions and
double-sold stock.

Instead: **the terminal only ever talks to the local store.** The network is never in the
critical path of a sale. "Online" simply means the sync engine is currently flushing the
outbox and pulling catalogue updates. The cashier flow, and the UI code, never branch on
connectivity.

Consequences that the rest of this doc builds on:
- Every sale is **committed locally first** and prints its receipt from local data.
- Sales are **append-only facts** pushed up later; they are never rejected on sync.
- The server is the **source of truth for the catalogue** (products, prices, stock baselines,
  user roster); the terminal is the source of truth for the **transactions** it records.

---

## 2. Topology

```
┌─────────────────────────── Electron app (one installable .exe) ───────────────────────────┐
│                                                                                            │
│   Renderer (Chromium)                 Preload / IPC bridge          Main process (Node)    │
│   ┌────────────────────┐              ┌──────────────┐             ┌─────────────────────┐ │
│   │  React POS terminal │  ── calls ─► │  window.pos  │ ── IPC ───► │  posApi impl        │ │
│   │  (same JSX as web)  │              │  (typed API) │             │  • local SQLite     │ │
│   │  reads/writes via   │ ◄── result ─ │              │ ◄────────── │    (better-sqlite3, │ │
│   │  the posApi PORT    │              └──────────────┘             │     SQLCipher)      │ │
│   └────────────────────┘                                           │  • outbox + sync    │ │
│                                                                     │  • auth/roster      │ │
│                                                                     └──────────┬──────────┘ │
└────────────────────────────────────────────────────────────────────────────── │ ──────────┘
                                                                                  │ HTTPS (when reachable)
                                                                                  ▼
                                                       ┌──────────────────────────────────────┐
                                                       │  Laravel server (HQ)                  │
                                                       │  • /api/pos/sync/push  (idempotent)   │
                                                       │  • /api/pos/sync/pull  (deltas)       │
                                                       │  • /api/pos/devices/enroll            │
                                                       │  • /api/pos/heartbeat                 │
                                                       │  • authoritative DB (MySQL)           │
                                                       └──────────────────────────────────────┘
```

- **Scope:** only the **POS terminal** runs in Electron and is offline-capable. The
  back-office (admin, inventory, purchasing, ledgers, accounting, reports) stays web/Inertia
  and **online-only** — keeping the offline surface small and auditable.
- **Main process owns the database.** The renderer never opens SQLite directly; it goes
  through IPC. This keeps the encryption key and DB handle out of the web layer.

---

## 3. The data-access port (build once)

The terminal UI depends on a thin interface — the **`posApi` port** — never on `fetch` or
Inertia directly. Two implementations satisfy the same interface:

| Build            | `posApi` implementation                                   |
|------------------|-----------------------------------------------------------|
| Web (online)     | calls Laravel JSON endpoints over `fetch`                 |
| Electron (offline-capable) | calls IPC → local SQLite + outbox + sync engine |

```js
// the contract the React terminal codes against — identical in both builds
posApi.auth.enrollDevice({ ... })      // online, once
posApi.auth.login(pin)                 // verifies locally against synced roster
posApi.auth.currentSession()
posApi.auth.logout()

posApi.catalog.searchProducts(query)   // barcode / name / code
posApi.catalog.getProduct(id)
posApi.catalog.getStock(productId)
posApi.catalog.listCustomers(query)

posApi.sales.createSale(payload)       // returns { uuid, docNo, receipt }
posApi.sales.createReturn(payload)
posApi.sales.holdBill(payload) / recallBill(id)
posApi.sales.cashClosing(payload)

posApi.sync.status()                   // { online, pending, lastPulledAt }
posApi.sync.forceSync()
```

**This is why Phase 4a must build the POS terminal client-rendered against a JSON API, not as
a server-round-trip Inertia page.** An Inertia page hard-wires the screen to a server request;
the port lets us swap the backend for the local store with zero changes to the screen.

---

## 4. Local data model (on-device SQLite)

Three groups of tables:

1. **Read model (synced down, read-only on device):**
   `products`, `product_prices`, `barcodes`, `stock_baseline`, `customers`, `tax_rates`,
   `terminal_config` (branch_id, terminal_id, number range), `sync_cursor`.
2. **Outbox (created on device, pushed up):**
   `pos_sales`, `pos_sale_lines`, `pos_payments`, `pos_returns`, `pos_cash_closings`,
   `pos_audit` — each row carries `uuid`, `status` (`pending`/`synced`/`rejected`),
   `client_seq`, `created_at`, `cashier_id`.
3. **Auth/roster (synced down):**
   `pos_users` (the roster — see §11), `pos_session` (current local session),
   `device_identity` (device id + key reference).

The whole file is **SQLCipher-encrypted at rest**; the key lives in the OS keychain via
Electron `safeStorage` (never hard-coded, never in the renderer).

---

## 5. Sale lifecycle (push)

```
Cashier completes sale
   │
   ▼
1. Allocate a doc number from the terminal's reserved range (§8)
2. Write sale + lines + payments to local SQLite (one transaction) → COMMIT
3. Print receipt from the just-written local rows
4. Row enters the outbox as `pending` with a stable client-generated `uuid`
   ┄┄┄ (could be seconds, or hours, later) ┄┄┄
5. Sync engine (when reachable) POSTs pending rows to /api/pos/sync/push
6. Server applies idempotently (decrement stock, post ledgers, record doc number) → ack
7. Local row: `pending → synced`
```

Steps 1–4 are identical online or offline and never wait on the network. Steps 5–7 are the
background sync.

---

## 6. Catalogue refresh (pull)

The sync engine pulls deltas from `/api/pos/sync/pull?since=<cursor>` into the read model:
products, prices, barcodes, stock baselines, customers, tax rates, **and the user roster**
(§11). Runs on launch, on a timer, and immediately on reconnect. Offline, the terminal serves
the **last-known snapshot** — slightly stale prices are acceptable and reconciled on the next
sync (§9).

---

## 7. Connectivity & the sync engine

- **Detection:** a periodic **heartbeat** `GET /api/pos/heartbeat` (do **not** trust
  `navigator.onLine` — it reports the NIC, not whether HQ is reachable). Success → flush +
  pull. Failure → keep selling locally; retry with exponential backoff.
- **Ordering:** push the outbox in `client_seq` order so dependent rows (sale → its return)
  apply in sequence.
- **Atomic acks:** a row flips to `synced` only after the server's per-`uuid` ack. A lost ack
  just means it re-sends next cycle (safe — see §10).
- **No cashier action ever required** to sync.

---

## 8. Document numbering (offline-safe)

A central server can't hand sequential numbers to a disconnected terminal. So:

- At enrollment each terminal is assigned a **reserved range or prefix** (e.g. `B1-T2-000001…`).
- Offline sales draw a **valid, collision-free** number from that local range immediately.
- On sync the server records the number as-is (it does not re-number).

This also matches **ZATCA Phase-2**, where each device maintains its own invoice counter
(ICV) and previous-invoice-hash (PIH) chain and generates the QR locally — offline-first is
the *correct* ZATCA model, not a workaround (full ZATCA work is Phase 9).

---

## 9. Conflict resolution

| Conflict | Rule |
|---|---|
| HQ changed a **price** while terminal was offline | Sale keeps the price actually charged (the receipt is the truth). HQ price applies to *future* sales after pull. Reports can flag the variance. |
| HQ changed the **catalogue** (new/edited/disabled product) | HQ wins on the read model at next pull. |
| Two terminals / HQ **moved the same stock** → negative on merge | The synced sale is **never rejected** (goods left the shelf = fact). Negative stock surfaces as a **variance** to fix via a stock adjustment. |
| Same sale **pushed twice** (lost ack) | Server dedupes on `uuid` → second push is a no-op (§10). |

Principle: **HQ is authoritative for master data; the terminal is authoritative for the
transactions it recorded.**

---

## 10. Idempotency & the sync endpoint contract

**Push** — `POST /api/pos/sync/push`
```jsonc
// request
{
  "device_id": "b1-t2",
  "mutations": [
    { "uuid": "9f2e…", "type": "sale",   "client_seq": 1187, "created_at": "…", "payload": { … } },
    { "uuid": "a3c1…", "type": "return", "client_seq": 1188, "created_at": "…", "payload": { … } }
  ]
}
// response — one result per uuid; idempotent
{
  "results": [
    { "uuid": "9f2e…", "status": "applied",   "server_doc_no": "B1-T2-000123" },
    { "uuid": "a3c1…", "status": "duplicate" }          // already applied earlier — no-op
    // or { "uuid": "…", "status": "rejected", "error": "…" }  ← logged, surfaced, not retried blindly
  ]
}
```
The server keys on `uuid`; re-sending an already-applied mutation returns `duplicate`, never a
second sale. This is the guarantee behind "sync once, no duplicates."

**Pull** — `GET /api/pos/sync/pull?since=<cursor>&device_id=…` → catalogue + roster deltas +
new `cursor` + `device_status` (e.g. `active` / `revoked`).

**Heartbeat** — `GET /api/pos/heartbeat` → `{ ok, server_time, device_status }`.

---

## 11. Offline authentication  ← the hard one

**The problem.** Phase-1 web auth is a server session (email + password validated by Laravel).
Offline there is no server to validate against — but a cashier must still log in before
selling. So we verify the cashier **locally**, against credentials that were synced while
online, and we anchor trust in the **enrolled device**.

### 11.1 Device enrollment (online, once)
When a terminal is first set up it must be **online**. A manager/owner signs in with full
credentials; the server:
- registers the device → `pos_devices` row (`device_id`, `branch_id`, `terminal_id`,
  `status=active`, assigned number range),
- issues a **device key/token** stored in the OS keychain (`safeStorage`),
- returns the initial **roster** + catalogue snapshot.

After this one-time online step the terminal is offline-capable. (You cannot bootstrap a brand
new terminal fully offline — first enrollment needs connectivity. This is a standard,
acceptable constraint.)

### 11.2 POS PIN + local verifier
Each user who may operate a till gets a **numeric POS PIN** (4–6 digits), set in the
back-office — separate from their web password (PINs are fast at the till). The server stores
and syncs only a **bcrypt/argon2id hash** of the PIN (the "verifier"), never the plaintext.
The roster row looks like:
```jsonc
{ "user_id": 42, "name": "Sara", "role": "cashier",
  "permissions": ["pos.sell","pos.return"], "pos_pin_hash": "$2y$…",
  "status": "active", "valid_until": "2026-07-31T00:00:00Z" }
```
(Alternative: reuse the account-password hash instead of a PIN. **PIN is the recommendation** —
faster and decoupled from web credentials.)

### 11.3 Offline login flow
```
Cashier enters PIN
   │
   ▼
Hash(PIN) compared to the synced pos_pin_hash for that user (local, bcrypt verify)
   │ match
   ▼
Mint a LOCAL session (§11.4) carrying user_id + role + permissions + terminal/branch
   │
   ▼
Cashier can sell — no server call was made
```
No internet is required. Wrong-PIN throttling (incrementing lockout) is enforced locally.

### 11.4 Local session
On success the device mints a **signed local session** (signed with the device key), stored in
`pos_session`: `{ user_id, terminal_id, branch_id, roles, permissions, issued_at, expires_at,
issued_offline: true }`. It drives `can()` checks in the terminal exactly like the web app's
permissions. Add an **idle auto-logout** (e.g. 5–10 min) and require login per shift. Every
sale records the `cashier_id` from this session.

### 11.5 Roster sync & permission changes
The roster is just another pull-down read model (§6). Add/disable a cashier or change a PIN at
HQ → it reaches the terminal on the next pull. A cashier created at HQ while the terminal is
offline simply can't log in there until the next sync (expected).

### 11.6 Revocation, staleness TTL & the lost-device threat model
The real threat is a **stolen terminal**, since auth is verified locally. Layered mitigations:
- **Encryption at rest:** SQLCipher DB + key in the OS keychain; the app requires the OS user
  session. Hashes are never plaintext.
- **Remote revoke:** mark the device `revoked` at HQ → on its next heartbeat/pull the device
  receives `device_status: revoked` and **wipes the local store / refuses login**.
- **Max-offline TTL:** the cached roster carries a `valid_until`. If the device has been dark
  longer than the TTL (e.g. 7 days), it **must sync before allowing another login** — bounding
  how long a stolen, never-reconnected device stays usable.
- **Idle logout + per-shift login** limit an unlocked-but-unattended till.

### 11.7 Manager override / supervisor approval
Voids, returns, price overrides, discounts can require a manager PIN — verified by the **same
local roster mechanism** (any roster user with the needed permission). Works fully offline.

### 11.8 Audit
Every offline login, failed-PIN attempt, sale, return, and override is written to a local
`pos_audit` table with `cashier_id`, `device_id`, timestamp, and `issued_offline`, and **syncs
up** with the outbox so HQ has a complete trail once reconnected.

---

## 12. Security summary

- Local DB **SQLCipher-encrypted**; key in OS keychain (`safeStorage`), never in renderer/code.
- **Device is the trust root** — enrolled, holds a device key, individually revocable.
- PINs/passwords stored only as **slow-KDF hashes** (bcrypt/argon2id), synced down, never plaintext.
- Transport is **HTTPS/TLS**; mutations are idempotent and signed by device id.
- **Least surface:** only the POS terminal is offline; everything else is online web.

---

## 13. First-run bootstrap & failure modes

| Situation | Behaviour |
|---|---|
| Brand-new terminal, no internet | Cannot enroll. Show "connect to HQ to set up this terminal." (One-time only.) |
| Enrolled, then internet drops | Keep selling; outbox grows; heartbeat retries; auto-flush on reconnect. |
| Offline beyond roster TTL | Block new logins until a sync; sessions already open can be allowed to finish the shift (policy choice). |
| Device reported stolen | On next contact → `revoked` → wipe + refuse login. |
| Disk/DB corruption | Re-enroll from server (sales already synced are safe at HQ; never-synced outbox is the only loss → keep frequent flush + local backups). |

---

## 14. Spike checklist (open the Phase 4b design spike with these)

- [ ] Choose Electron tooling: `electron-vite` + `electron-builder` + `electron-updater`.
- [ ] Choose local store: `better-sqlite3` + SQLCipher; confirm key storage via `safeStorage`.
- [ ] Define the `posApi` port + both implementations (web `fetch`, Electron IPC).
- [ ] Finalize the push/pull/heartbeat/enroll endpoint contracts (§10).
- [ ] Decide the document-number range scheme per terminal (§8) and align with ZATCA (Phase 9).
- [ ] Decide PIN policy (length, throttle, TTL) and roster sync cadence.
- [ ] Decide max-offline TTL and revocation/wipe behaviour.
- [ ] Build the conflict/variance report for negative-stock reconciliation (§9).
- [ ] End-to-end acceptance: enroll → go offline → login by PIN → sell all tender types →
      return → reconnect → sync once, no dupes, ledgers/stock/audit correct → revoke → wipe.
```
