# Evana Fresh POS — Desktop (Electron)

The offline-first POS terminal. It runs the **same online and offline**: every sale is
written to a local SQLite store first and a background sync engine reconciles with the
Laravel server (`../`) whenever it's reachable. Full design: [../docs/OFFLINE-POS.md](../docs/OFFLINE-POS.md).

> Status: **spike**. The sync engine, local store, offline PIN login, and outbox are built
> and the client sync logic is covered by a headless test. The server contract it talks to is
> proven by `../tests/Feature/PosSyncTest.php`.

## Architecture (build once, run anywhere)

```
renderer (React)  ──window.posBridge.invoke──►  main process
src/renderer/         (preload IPC bridge)        src/main/
  App.jsx                                           index.js        Electron window + IPC
  posApi.js  ◄─── the PORT the UI codes against     pos-api.mjs     facade (store+sync+auth)
                                                     store-sqlite.mjs  local SQLite (better-sqlite3)
                                                     sync.mjs        sync engine (enroll/pull/push)
                                                     auth.mjs        offline PIN verify (bcrypt)
                                                     api-client.mjs  HTTP → Laravel /api/pos/*
```

The renderer never touches the DB or network directly — it only calls `posApi`. The same
`sync.mjs` / `store` interface is exercised headlessly in `test/` with an in-memory store.

## Prerequisites

- Node 20+, and the Laravel server running (`cd .. && php artisan serve`, default `:8000`).
- Seeded demo data (`php artisan migrate:fresh --seed`). Manager `manager@evanafresh.com` /
  `password`; cashier PIN `2222` (Yusuf, B1).

## Run it (on your Mac)

```bash
cd desktop
npm install            # also runs electron-builder install-app-deps (rebuilds better-sqlite3 for Electron)
npm run dev            # launches the Electron window
```

Point at a non-default server with `POS_BASE`:

```bash
POS_BASE=http://127.0.0.1:8000 npm run dev
```

### First-run flow
1. **Enroll** — manager email/password + Terminal ID `1` (defaults are pre-filled). Issues the device token.
2. **PIN login** — cashier PIN `2222`. Verified locally against the synced roster (works offline).
3. **Sell** — tap products → *Take cash & complete*. The sale goes to the local outbox and
   syncs automatically; pull your network and it keeps working, reconnect and it drains.

## Test the client sync logic (headless, no Electron)

```bash
node --test test/            # enroll → pull → offline queue → sync → idempotent → offline-safe
```

## Package installers

```bash
npm run dist                 # electron-builder → dist/ (dmg / nsis / AppImage)
```

## Production hardening (not in the spike)

- **Encryption at rest:** swap `better-sqlite3` for `better-sqlite3-multiple-ciphers` and pass a
  `key` (from Electron `safeStorage`/OS keychain) to `createSqliteStore` — `store-sqlite.mjs`
  already calls `PRAGMA key`.
- **Auto-update:** uncomment the `publish` block in `electron-builder.yml` and add `electron-updater`.
- **Code-signing:** configure signing certs for macOS/Windows in `electron-builder.yml`.
- **Max-offline TTL + remote wipe:** enforce the roster `valid_until` and act on `device_status: revoked`.
