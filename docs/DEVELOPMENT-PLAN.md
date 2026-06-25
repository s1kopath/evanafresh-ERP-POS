# EIBMS — Development Plan

Step-by-step implementation plan for the Evana Fresh Integrated Business Management
System. Built **module by module**; each phase is a self-contained, shippable slice.

- **Feature catalog & progress (source of truth):** [FEATURE-CHECKLIST.md](FEATURE-CHECKLIST.md) — full feature list; tick items as they land
- **Session instructions:** [../CLAUDE.md](../CLAUDE.md)

---

## 1. Guiding principles

1. **Vertical slices.** Each phase delivers a usable screen end-to-end (migration →
   model → controller → Inertia page) rather than a horizontal layer. Always leave the
   app booting and the checklist updated.
2. **Branch-scoped by default.** Almost every table carries a `branch_id`. A global
   query scope + the authenticated user's branch context enforce isolation; owners can
   see all branches.
3. **Money is integer minor units.** Store amounts as integers (halalas, 1 SAR = 100
   halalas) or `decimal(15,2)` — never floats. Currency is **SAR**, VAT is **15%**.
   Centralize money formatting in one helper on each side (PHP + JS).
4. **Append-only ledgers.** Customer/supplier/general ledgers are never edited in place;
   corrections are new reversing entries. Every financial mutation writes an audit log.
5. **Portable SQL.** Dev uses SQLite, production uses MySQL. Avoid engine-specific SQL;
   prefer Eloquent + the query builder. Test migrations on both before shipping a phase.
6. **English-only.** No Arabic/RTL. Don't add localization scaffolding.
7. **Offline is a first-class design constraint** for POS (Phase 4) — design the sale
   data model so it can be created client-side and synced (stable UUIDs, idempotent sync).

---

## 2. Architecture overview

### Stack
- **Backend:** Laravel 13 (PHP 8.3), Inertia server adapter (`inertiajs/inertia-laravel`).
- **Frontend:** React 19 + Inertia React, Vite 8, Tailwind v4. JSX (no TypeScript).
- **DB:** MySQL (prod) / SQLite (dev + offline POS local store).
- **Auth:** session-based (Phase 1), RBAC via roles + permissions.
- **POS desktop client:** the offline-capable POS terminal ships as an **Electron** app
  (electron-vite + electron-builder, electron-updater for auto-update) bundling a local
  SQLite store; it runs the same online and offline. Back-office (admin, reports, accounting)
  stays web/Inertia and online-only. See Phase 4b.

### Core domain entities (target data model)
```
Company ─┬─ Branch ──┬─ Terminal (POS)
         │           ├─ User (role, branch scope)
         │           └─ StockLevel ── Product
         ├─ Product ─┬─ Category
         │           ├─ Unit (+ conversions)
         │           └─ Batch (expiry, cost)  ← lot tracking
         ├─ Customer ── CustomerLedgerEntry
         ├─ Supplier ── SupplierLedgerEntry
         ├─ Sale ──────── SaleLine, Payment, Return
         ├─ Purchase ──── PurchaseLine, GRN, PurchaseReturn, PurchaseOrder
         ├─ StockMovement (single source of truth for every stock change)
         ├─ StockTransfer (inter-branch, request/approve)
         ├─ Account (chart of accounts) ── JournalEntry ── JournalLine
         ├─ Employee ── Payroll
         ├─ Expense, CashbookEntry, BankAccount
         └─ AuditLog
```

### Key cross-cutting decisions to make early (Phase 1–2)
- **Stock as movements.** Every sale/purchase/adjustment/transfer writes an immutable
  `stock_movements` row; `stock_levels` is a cached projection. Makes valuation,
  reversals, and audit straightforward.
- **Valuation method** (FIFO vs weighted average) — pick **weighted average** as default
  (simpler, matches grocery), keep the door open for FIFO via batch costs.
- **Numbering** — per-branch sequential document numbers (invoice, GRN, PO) generated
  transactionally.
- **Offline sync contract** — define the JSON envelope + idempotency key for POS sales
  before building Phase 4.

---

## 3. Phase plan

> Phase numbers match the badges shown on the in-app module stubs.

### Phase 0 — Foundation ✅ (done this session)
**Goal:** A booting app with the right stack and a navigable shell.
- Laravel 13 + Inertia + React + Tailwind v4 wired (`app.jsx`, `app.blade.php`, middleware).
- `AppLayout` (sidebar + topbar), brand palette tokens, `@` import alias.
- Dashboard + stub pages for every module (each carries its planned scope).
- SQLite dev DB, base migrations run.
**Acceptance:** `npm run build` succeeds; every sidebar route renders.

---

### Phase 1 — Core platform: auth, RBAC, branches, audit
**Why first:** everything else is branch-scoped and permission-gated.
- **Data model:** `companies`, `branches`, `terminals`, extend `users` (`branch_id`,
  `is_owner`, `pos_pin_hash`), `roles`, `permissions`, `role_user`, `permission_role`,
  `pos_devices` (enrolled device registry: device id/key, branch/terminal, status, number range),
  `audit_logs`.
- **Backend:** auth (login/logout, session), policies/gates, roles seeding
  (owner, manager, accountant, cashier), a `BelongsToBranch` global scope + `current branch`
  resolver, an `AuditLog` observer/trait, an `Inertia` shared-prop for `auth.user` +
  `permissions` + `branches`. Also seed the auth primitives the **offline POS** depends on:
  a per-user **POS PIN** (numeric, bcrypt-hashed) and a **device enrollment** endpoint/registry —
  the terminal verifies cashiers locally against the synced PIN hash (see Phase 4b /
  [OFFLINE-POS.md](OFFLINE-POS.md)).
- **Frontend:** Login page, branch switcher in topbar (owner/manager), `can()` helper
  for conditional UI, replace the placeholder avatar/branch chip with real data.
- **Acceptance:** users log in; a cashier sees only their branch; owner switches branches;
  every write records an audit log.
- **Covers checklist:** RBAC, multi-branch isolation, audit logs, branch switching.

### Phase 2 — Master data & settings
**Why:** all transactional modules depend on the catalogue and parties.
- **Data model:** `categories`, `units` (+ `unit_conversions`), `products`
  (barcode, sell price, tax, `is_weight_based`, reorder level, optional `image_path`),
  `product_branch` (per-branch min levels & price overrides), `customers` (credit limit,
  opening balance), `suppliers` (opening balance), `employees` (salary, join date, branch,
  status — feeds payroll), `tax_rates`, `settings` (store header, ZATCA TRN, thresholds).
  Master data is **company-scoped** (`BelongsToCompany`), not branch-scoped.
- **Backend:** CRUD controllers + form requests + policies for each; barcode/QR
  generation; product image upload optimized server-side via GD (`App\Support\ImageOptimizer`,
  WebP, ≤600px); CSV import for opening data; opening-balance posting into ledgers.
- **Frontend:** index/create/edit pages (reusable table + form components),
  barcode label preview, settings screens (replaces the Settings stub).
- **Acceptance:** can create products/customers/suppliers/employees, set per-branch min levels,
  configure VAT/TRN and store header.
- **Covers checklist:** product categorization, UoM + conversion, barcode/QR gen,
  customer/supplier registration, employee/staff records, credit-limit config, min-stock config,
  tax config.

### Phase 3 — Inventory management (+ expiry)
- **Data model:** `stock_movements` (source of truth), `stock_levels` (projection),
  `batches` (expiry, cost, qty), `stock_adjustments` (+ reason), `stock_transfers`
  (+ lines, status: requested/approved/received).
- **Backend:** movement service (apply/reverse), weighted-average valuation, low-stock
  detection job + notifications (in-app now; SMS/email channels stubbed), near-expiry
  scanner job, transfer request/approval workflow, velocity classification
  (fast/slow/dead), valuation & summary reports.
- **Frontend:** stock dashboard (real-time across branches), batch/expiry views,
  adjustment form, transfer request/approve screens, expiry-risk dashboard,
  fast/slow/dead reports (replaces Inventory stub).
- **Acceptance:** receiving stock updates levels & batches; low-stock and near-expiry
  alerts fire; inter-branch transfer moves stock with approval; valuation report ties out.
- **Covers checklist:** all Inventory + Expiry items.

### Phase 4 — POS & Sales (the hardest; do after inventory exists)
**Build online first, then add offline.**
- **4a — Online POS:**
  - **Data model:** `sales`, `sale_lines`, `payments` (cash/card/credit split),
    `sales_returns`, `return_lines`, `held_bills`; sale uses a client-stable `uuid`.
  - **Backend:** sale service (decrement stock via movements, update customer ledger on
    credit, generate per-branch invoice number), returns with stock reversal, refund /
    credit note, end-of-day cash closing per terminal/branch, thermal-receipt payload
    (+ placeholder QR; real ZATCA QR in Phase 9).
  - **Frontend:** full POS terminal — fast item entry (barcode + search), weight entry,
    cart, mixed-tender payment, hold/recall, returns, receipt print view. **Build it
    client-rendered against a JSON API (not a server-round-trip Inertia page)** so the exact
    same terminal drops into the Electron offline app (4b) unchanged.
- **4b — Offline (Electron desktop app):**
  - **Packaging:** ship the POS terminal as an **Electron** desktop app (electron-vite build;
    `electron-builder` installers for Windows/macOS; `electron-updater` auto-update). Cashiers
    install and run one executable that works **both online and offline** — same UI either
    way, no mode toggle.
  - **Local-first store:** embedded **SQLite** in the Electron main process (`better-sqlite3`,
    SQLCipher-encrypted at rest); the renderer reaches it over IPC. Every read/write hits the
    local store first, so the terminal never blocks on the network.
  - **Sync engine:** an **outbox** of pending mutations (sales, payments, returns) keyed by the
    sale `uuid`; a background worker flushes to an idempotent Laravel JSON sync endpoint and
    pulls HQ product/price/stock deltas. Connectivity is auto-detected (heartbeat); sync is
    automatic on reconnect — zero cashier intervention.
  - **Conflict resolution:** HQ catalogue/price/stock changes made during the offline window
    reconcile cleanly on sync (HQ wins for catalogue/price; sales are append-only and never lost).
  - **Offline auth:** the device is **enrolled once while online** (a manager logs in; the server
    registers the device to a branch/terminal and issues a device key). Thereafter cashiers log
    in with a **numeric POS PIN verified locally** against the synced, bcrypt-hashed roster — no
    server call needed. A signed local session carries the cashier's role/permissions into each
    sale. Revocation and roster/PIN changes propagate on the next sync; a **max-offline TTL**
    forces a sync before login if the device has been dark too long. Stolen-device risk is
    bounded by SQLCipher encryption + remote revoke/wipe.
  - **Numbering:** each terminal draws invoice numbers from a **reserved per-terminal range** so
    offline sales get valid, collision-free numbers (also the correct ZATCA per-device counter
    model — Phase 9).
  - **Reuse:** because the 4a terminal is already client-rendered against a JSON API, 4b only
    swaps that API client for the local-first store + sync — the screen code is unchanged.
  - **Acceptance:** enroll online → go offline → log in by PIN → keep selling (all tender types,
    returns) → reconnect → sales sync once, no dupes, ledgers/stock/audit correct; revoke the
    device → it wipes & refuses login; ship a new build → the app auto-updates.
  - **Full design + sync-endpoint contract + offline-auth spec:** [OFFLINE-POS.md](OFFLINE-POS.md).
- **Covers checklist:** all POS & Sales items (incl. the offline block).
- **Risk:** offline + sync is the biggest technical risk → schedule a dedicated design
  spike at the start of 4b.

### Phase 5 — Purchasing & reorder planning
- **Data model:** `purchase_orders` (+lines), `goods_receipts` (GRN, +lines, expiry/batch
  capture), `purchases` (bills, +lines), `purchase_returns`, `purchase_prices` (history).
- **Backend:** PO create/dispatch, GRN → stock movements + batches, purchase entry
  (direct or against PO) with partial payment → supplier ledger (AP), purchase returns,
  price-history tracking, reorder engine (stock vs min + sales velocity + preferred
  supplier), one-click reorder → PO, PDF/Excel export, WhatsApp share (wa.me deep link).
- **Frontend:** PO, GRN, purchase entry, returns, reorder list screen (replaces Purchasing stub).
- **Acceptance:** GRN updates stock+batches; partial-payment bill posts AP balance;
  reorder list generates and converts to PO; export + WhatsApp share work.
- **Covers checklist:** all Purchase + Reorder & Purchase Planning items.

### Phase 6 — Customer & supplier ledgers / dues
- **Data model:** `customer_ledger_entries`, `supplier_ledger_entries` (append-only,
  running balance), `payments`/`receipts` linked to ledgers, `advances`.
- **Backend:** due-collection workflow (+ receipt), partial payments, statements
  (date range), aging buckets (30/60/90+), credit-limit breach alerts, supplier advances
  with adjustment against future invoices.
- **Frontend:** customer & supplier ledger screens, statement view (print + WhatsApp),
  aging reports (replaces the two Ledger stubs).
- **Acceptance:** credit sale → balance up; collection → balance down + receipt; statement
  and aging correct; advance adjusts against next invoice.
- **Covers checklist:** all Customer Due + Supplier/Vendor items.

### Phase 7 — Accounting & finance
- **Data model:** `accounts` (chart of accounts), `journal_entries` (+`journal_lines`,
  double-entry), `expenses`, `payrolls` (per `employee` from Phase 2), `cashbook_entries`,
  `bank_accounts`, `bank_reconciliations`.
- **Backend:** GL postings auto-generated from sales/purchases/payments, expense &
  payroll entry (monthly run over active employees), daily cash book + cash closing,
  bank reconciliation, financial statement
  builders: Trial Balance, P&L (month/quarter/year), Balance Sheet, Cash Flow,
  AR/AP aging, consolidated multi-branch.
- **Frontend:** chart of accounts, expense/payroll/cashbook screens, statements
  (replaces Accounting stub); dashboard KPIs become live aggregates.
- **Acceptance:** every transaction posts balanced journal lines; trial balance balances;
  P&L and balance sheet tie out per branch and consolidated.
- **Covers checklist:** all Accounting & Financial items + live dashboard KPIs.

### Phase 8 — Reports & analytics
- **Backend:** sales reports (by branch/cashier/payment method, daily/weekly/monthly),
  product profitability (margin per product/category), best-selling, slow/dead reuse of
  Phase 3, branch performance comparison, expense & supplier-payment reports; a shared
  export layer (PDF + Excel) and WhatsApp share.
- **Frontend:** report center with filters, charts, export buttons (replaces Reports stub).
- **Acceptance:** each report renders, filters, and exports; numbers match source modules.
- **Covers checklist:** all Business Reports & Analytics items.

### Phase 9 — ZATCA Phase-2 (FATOORA) e-invoicing
**Cross-cutting; integrates into POS (B2C) and Purchasing/Sales (B2B).**
- Device onboarding (CSR, compliance + production CSIDs), simplified tax invoices (B2C)
  with QR (TLV base64) generated at POS, standard tax invoices (B2B) as UBL 2.1 XML with
  cryptographic stamp, clearance/reporting via ZATCA APIs, 15% VAT handling, VAT-return
  support, TRN on invoices.
- **Acceptance:** sandbox onboarding succeeds; B2C QR validates; B2B XML clears in the
  ZATCA sandbox.
- **Risk:** external compliance dependency → start sandbox onboarding early, in parallel.

### Phase 10 — Mobile app (owner / management)
- Android + iOS app (owner/management roles): real-time sales & inventory monitoring,
  approve POs and stock transfers, dashboards. Reuses the same Laravel API (expose a
  token-auth API surface). Decide React Native vs PWA install at phase start.
- **Distinct from the Phase 4b Electron desktop app**, which is the cashier POS station
  (offline-capable). This mobile app is owner/management monitoring and is online-only.
- **Covers checklist:** all Mobile & Cloud Access app items.

### Phase 11 — Hardening, backup, deployment, hypercare
**Build & deploy steps for both apps live in [BUILD-AND-DEPLOY.md](BUILD-AND-DEPLOY.md).**
- Cloud deploy (client-provided hosting), automated **encrypted daily backups**, SSL,
  RBAC review, AES encryption at rest for sensitive fields, **SMS + email notification
  gateways** (Twilio/SMTP) to wire the low-stock / near-expiry / alert channels stubbed in
  Phase 3, **code-signed Electron POS installers + an electron-updater release feed**
  (with the local POS store SQLCipher-encrypted), performance passes, seed/demo data for the
  8 demo scenarios, UAT, go-live + hypercare.

---

## 4. Suggested session cadence

Pick up **one phase (or one sub-feature of a large phase) per session**:

1. Open [FEATURE-CHECKLIST.md](FEATURE-CHECKLIST.md), choose the next unchecked group.
2. Read the relevant phase section above.
3. Implement the vertical slice (migration → model → controller → Inertia page).
4. Replace the corresponding module stub with the real screen.
5. Tick the checklist items, update phase status, ensure `npm run build` + migrations pass.
6. Commit.

**Recommended order:** 1 → 2 → 3 → 4a → 6 → 5 → 7 → 8 → 4b → 9 → 10 → 11.
(Ledgers (6) before Purchasing (5) is optional — both are valid; ledgers make the AP/AR
posting in Purchasing/POS more meaningful. Offline POS (4b) and ZATCA (9) are the two
hardest items — keep design spikes for them early even if implemented later.)
