# EIBMS — Build & Deployment Guide

How to build, package, and ship every piece of the Evana Fresh system. Keep this current as
the build pipeline evolves. Related: [DEVELOPMENT-PLAN.md](DEVELOPMENT-PLAN.md) (Phase 11 =
deployment/hardening), [OFFLINE-POS.md](OFFLINE-POS.md) (the desktop POS internals).

## What ships

| Deliverable | Stack | Distribution | Status |
|---|---|---|---|
| **Web back-office** (admin, inventory, purchasing, ledgers, accounting, reports) | Laravel 13 + Inertia/React, Vite | Cloud, online-only | building (Phase 1+) |
| **Desktop POS terminal** | Electron + React, local SQLite | Installable `.dmg` / `.exe` / `.AppImage`, offline-first | spike done (`desktop/`) |
| **Mobile app** (owner/manager) | React Native or PWA (TBD) | App stores / install | Phase 10 — not started |

## Toolchain prerequisites

- **Web:** PHP 8.3, Composer, Node 20+, npm. Prod DB: MySQL. Dev DB: SQLite.
- **Desktop:** Node 20+, plus per-OS native build tools (Xcode Command Line Tools on macOS;
  Visual Studio Build Tools on Windows; `build-essential` on Linux) because `better-sqlite3`
  compiles natively.

---

## 1. Web back-office (Laravel + Inertia)

### Develop
```bash
composer dev        # serve + queue + logs + vite (all-in-one)
# or: php artisan serve  &  npm run dev
```
If `public/hot` exists but no Vite dev server runs, delete it (it forces dev-mode assets).

### Build for production
```bash
# 1. Front-end assets → public/build/ + manifest.json
npm ci
npm run build

# 2. PHP deps (no dev, optimized autoloader)
composer install --no-dev --optimize-autoloader

# 3. Database (MySQL in prod)
php artisan migrate --force

# 4. Framework caches (config + route + view + event)
php artisan optimize
```

### Production environment
- `.env`: `APP_ENV=production`, `APP_DEBUG=false`, a generated `APP_KEY`, `APP_URL=https://…`,
  and MySQL credentials (`DB_CONNECTION=mysql`, …).
- Web server (nginx/Apache) document root = **`public/`**, fronting PHP-FPM.
- **Queue worker** (low-stock / near-expiry scanners, exports) — run `php artisan queue:work`
  under a supervisor (systemd/Supervisor), restarted on deploy.
- **Scheduler** — one cron line: `* * * * * php artisan schedule:run` (drives near-expiry
  scans, backups, etc.).
- Ensure `public/hot` is **absent** so the built manifest is used.
- SSL/TLS, encrypted daily backups, AES-at-rest for sensitive fields → Phase 11.

### Redeploy checklist
`git pull` → `composer install --no-dev -o` → `npm ci && npm run build` →
`php artisan migrate --force` → `php artisan optimize` → restart queue workers.

---

## 2. Desktop POS terminal (Electron)

Everything lives in [`desktop/`](../desktop). Full architecture: [desktop/README.md](../desktop/README.md).

### Develop
```bash
cd desktop
npm install         # postinstall runs electron-builder install-app-deps (rebuilds better-sqlite3 for Electron)
npm run dev         # launches the Electron window (electron-vite dev server)
POS_BASE=http://127.0.0.1:8000 npm run dev   # point at a specific server
```

### Build & package
```bash
npm run build       # compile main/preload/renderer → desktop/out/   (no installer)
npm run dist        # electron-vite build && electron-builder → installers in desktop/dist/
npm run test        # headless test of the client sync logic (node --test)
```

Targets (from [desktop/electron-builder.yml](../desktop/electron-builder.yml)):

| OS | Output | Must build on |
|---|---|---|
| macOS | `.dmg` | a Mac |
| Windows | `.exe` (NSIS) | Windows |
| Linux | `.AppImage` | Linux |

### ⚠️ Build on each target OS
electron-builder packages for the **host OS**, and `better-sqlite3` is a **native module
compiled per platform + per Electron ABI** — you can't reliably cross-compile a Windows `.exe`
from a Mac. Produce all three either by running `npm run dist` on each OS, or via **CI** (below).
Force a single target when the toolchain is present: `npx electron-builder --win|--mac|--linux`.

### Server URL in packaged builds
Dev uses the `POS_BASE` env var (default `http://127.0.0.1:8000`). For a shipped build, bake the
production API URL at build time (env) or add a one-time "server address" field to the enroll
screen. Don't hard-code `127.0.0.1` into a release.

### Code signing (before distribution)
- **macOS:** Apple Developer ID cert + **notarization** (else Gatekeeper blocks it). Configure
  signing identity + `notarize` in electron-builder; supply `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD`.
- **Windows:** an Authenticode code-signing cert (else SmartScreen warns users).

### Auto-update
Uncomment the `publish:` block in `electron-builder.yml`, add `electron-updater`, and host the
release feed (generic URL, S3, or GitHub Releases). The app checks the feed and self-updates.

### Encryption at rest (production)
The spike uses plain `better-sqlite3` (unencrypted). For production, swap to
`better-sqlite3-multiple-ciphers` and pass a `key` (from Electron `safeStorage` / OS keychain)
into `createSqliteStore` — `desktop/src/main/store-sqlite.mjs` already issues `PRAGMA key`.

### Versioning & release flow
Bump `desktop/package.json` `version` → tag (`git tag pos-vX.Y.Z`) → CI builds & publishes the
three installers → users auto-update (once electron-updater is wired).

---

## 3. CI: build all three installers from one push (recommended)

A GitHub Actions matrix builds macOS/Windows/Linux installers without owning three machines.
Drop this at `.github/workflows/desktop-release.yml`:

```yaml
name: Desktop POS release
on:
  push:
    tags: ['pos-v*']
jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    defaults:
      run:
        working-directory: desktop
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm install
      - run: npm test
      - run: npm run dist
        env:
          # Signing/notarization secrets go here (macOS: CSC_LINK, CSC_KEY_PASSWORD,
          # APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD; Windows: CSC_LINK, CSC_KEY_PASSWORD)
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - uses: actions/upload-artifact@v4
        with:
          name: pos-${{ matrix.os }}
          path: desktop/dist/*.(dmg|exe|AppImage)
```

For the **web app**, deployment is environment-specific (VPS, container, or PaaS); standardize on
the "Redeploy checklist" above wired into your host's pipeline.

---

## Release checklist (per ship)

- [ ] Web: `npm run build` + `composer install --no-dev -o` + `migrate --force` + `optimize`; workers restarted; `public/hot` absent.
- [ ] Desktop: version bumped; `npm test` green; installers built per-OS (or via CI); signed & notarized.
- [ ] Desktop points at the **production** API URL, not localhost.
- [ ] Encrypted backups verified (Phase 11); SSL valid.
