# EIBMS — Feature Checklist (Progress Tracker)

Tick each item as it ships. Keep in sync with [DEVELOPMENT-PLAN.md](DEVELOPMENT-PLAN.md).
`[ ]` = not started · `[~]` = in progress · `[x]` = done & verified.

**Phase tags:** P1 Core/RBAC · P2 Master Data · P3 Inventory · P4 POS · P5 Purchasing ·
P6 Ledgers · P7 Accounting · P8 Reports · P9 ZATCA · P10 Mobile · P11 Deploy

---

## Phase 0 — Foundation ✅
- [x] Laravel 13 + Inertia + React 19 + Tailwind v4 wired up
- [x] App layout (sidebar + topbar) with brand palette
- [x] **Fully responsive layout** (off-canvas drawer + hamburger below `lg`)
- [x] Dashboard with KPI placeholders
- [x] Module stub pages (POS, Inventory, Purchasing, Ledgers ×2, Accounting, Reports, Settings)
- [x] SQLite dev database + base migrations
- [x] Routing for all modules
- [x] **Shared UI kit** — Button, Card, Badge, EmptyState, Spinner
- [x] **Skeleton loaders** (Skeleton/Text/Card/Table)
- [x] **Toast alerts** (`useToast` + Laravel flash bridge)
- [x] **Page-load progress bar** (Inertia NProgress, configured)
- [x] **Modal + ConfirmDialog**, **Pagination**, form fields (Input/Select/Textarea/FormField)
- [x] Format helpers (`formatMoney`/`formatNumber`/`formatDate`) + `cn` classnames
- [x] `/ui-kit` living component reference page

## Phase 1 — Core platform: auth, RBAC, branches, audit
- [ ] Login / logout (session auth)  ·P1
- [ ] Roles: owner, manager, accountant, cashier  ·P1
- [ ] Permissions + policy gates + `can()` UI helper  ·P1
- [ ] Companies & branches model  ·P1
- [ ] Branch-scoped data isolation (global scope + branch context)  ·P1
- [ ] Branch switcher (owner/manager) in topbar  ·P1
- [ ] Audit logs for all writes  ·P1
- [ ] POS PIN per user (numeric, bcrypt) for terminal login  ·P1
- [ ] POS device enrollment + trust registry (bind device → branch/terminal)  ·P1
- [ ] Shared Inertia props: auth user, permissions, branches  ·P1

## Phase 2 — Master data & settings
- [ ] Product categories (grocery, dairy, produce, frozen, beverages, …)  ·P2
- [ ] Units of measurement + conversions (kg, g, pcs, box, …)  ·P2
- [ ] Products (barcode, price, tax, weight-based flag, reorder level)  ·P2
- [ ] Per-branch min stock levels & price overrides  ·P2
- [ ] Barcode & QR generation + label preview  ·P2
- [ ] Customer registration + credit limit + opening balance  ·P2
- [ ] Supplier registration + opening balance  ·P2
- [ ] Employee/staff records (salary, join date, branch, status) — feeds payroll  ·P2
- [ ] Tax/VAT config (15%) + TRN + store header settings  ·P2
- [ ] Opening-data CSV import  ·P2

## Phase 3 — Inventory management
- [ ] Real-time stock monitoring across branches (central dashboard)  ·P3
- [ ] Stock movements as source of truth + stock-level projection  ·P3
- [ ] Stock valuation — weighted average (FIFO-ready via batch cost)  ·P3
- [ ] Batch & lot tracking with traceability  ·P3
- [ ] Low-stock alerts — in-app (SMS + email channels)  ·P3
- [ ] Stock adjustment with reason (damage, loss, sample, correction)  ·P3
- [ ] Branch-wise stock comparison & valuation reports  ·P3
- [ ] Fast-moving product report  ·P3
- [ ] Slow-moving product report  ·P3
- [ ] Dead stock report  ·P3
- [ ] Inventory valuation report  ·P3
- [ ] Branch-wise stock summary  ·P3

### Expiry management
- [ ] Expiry date entry at GRN  ·P3
- [ ] Near-expiry alerts (configurable threshold: 7/14/30 days)  ·P3
- [ ] Expired stock reports (filter by product/category/branch)  ·P3
- [ ] Near-expiry promotion / auto-discount management  ·P3
- [ ] Expiry-risk dashboard (near-expiry value at a glance)  ·P3

## Phase 4 — POS & Sales
### Online
- [ ] Barcode product sales (scan-to-sell, auto price/tax)  ·P4
- [ ] Non-barcode sales (lookup by name/code)  ·P4
- [ ] Weight-based sales (scale support, price-per-kg)  ·P4
- [ ] Cash payment + change calculation  ·P4
- [ ] Card payment (manual entry after payment)  ·P4
- [ ] Partial / split payment (cash + card + credit)  ·P4
- [ ] Customer credit sales → auto ledger update  ·P4
- [ ] Multi-terminal POS per branch  ·P4
- [ ] Thermal receipt printing (store header + QR)  ·P4
- [ ] End-of-day cash closing per terminal & per branch  ·P4
- [ ] Sales return with automatic stock reversal  ·P4
- [ ] Refund management (cash refund or credit note)  ·P4
- [ ] Return reason tracking & reporting  ·P4
- [ ] Held / parked bills  ·P4
### Offline — Electron desktop app (design spike first · full spec: [OFFLINE-POS.md](OFFLINE-POS.md))
- [ ] Electron desktop build — installable executable (Windows/macOS), runs online + offline  ·P4
- [ ] Client-rendered POS terminal (JSON API, no server round-trips) — same code both modes  ·P4
- [ ] Local-first SQLite store on device (SQLCipher-encrypted), accessed via IPC  ·P4
- [ ] Device enrollment (online, once) → trusted device key in OS keychain  ·P4
- [ ] Offline login — POS PIN verified locally against synced roster  ·P4
- [ ] Local signed session (role/permissions) + idle auto-logout  ·P4
- [ ] Per-terminal document number ranges (offline-safe invoice numbering)  ·P4
- [ ] Fully offline POS — identical interface/workflow  ·P4
- [ ] All transaction types offline (sales, payments, returns, refunds)  ·P4
- [ ] Outbox + automatic sync on reconnect (idempotent, no dupes)  ·P4
- [ ] Roster/catalogue pull-down sync + device revocation/wipe on reconnect  ·P4
- [ ] Conflict resolution for HQ stock/price changes (negative-stock variance report)  ·P4
- [ ] Max-offline TTL forces a sync before login when device dark too long  ·P4
- [ ] Zero manual cashier intervention for sync  ·P4
- [ ] Code-signed installers + auto-update (electron-updater)  ·P11

## Phase 5 — Purchasing & reorder
### Purchase management
- [ ] Purchase order creation & dispatch to supplier  ·P5
- [ ] Goods Receive Note (GRN) → auto inventory update  ·P5
- [ ] Purchase entry (direct or against PO)  ·P5
- [ ] Purchase returns with supplier ledger adjustment  ·P5
- [ ] Purchase price history per product per supplier  ·P5
- [ ] Supplier-wise purchase analysis & cost comparison  ·P5
- [ ] Bill processing workflow (entry → payment)  ·P5
- [ ] Purchase with partial payment → AP balance  ·P5
### Reorder & purchase planning
- [ ] Automatic reorder list (stock vs min levels)  ·P5
- [ ] Purchase suggestions (sales trends / seasonal)  ·P5
- [ ] Supplier-linked reorder suggestions (preferred supplier)  ·P5
- [ ] One-click reorder list → purchase order  ·P5
- [ ] Reorder reports export to PDF & Excel  ·P5
- [ ] WhatsApp sharing of reorder reports  ·P5

## Phase 6 — Ledgers & dues
### Customer due management
- [ ] Customer ledger (full transaction history)  ·P6
- [ ] Credit sales with real-time outstanding balance  ·P6
- [ ] Partial payment collection → ledger update  ·P6
- [ ] Due collection workflow + payment receipt  ·P6
- [ ] Customer statements (print + WhatsApp)  ·P6
- [ ] Aging report (30 / 60 / 90+ days)  ·P6
- [ ] Credit limit config + breach alert  ·P6
### Supplier & vendor management
- [ ] Supplier ledger (purchases, payments, balances)  ·P6
- [ ] Partial payment recording against invoices  ·P6
- [ ] Supplier due reports (overdue payables)  ·P6
- [ ] Supplier statements (print + share)  ·P6
- [ ] Supplier-wise purchase analysis (price/volume/frequency)  ·P6
- [ ] Advance payment tracking + adjustment vs future invoices  ·P6

## Phase 7 — Accounting & finance
- [ ] General Ledger + configurable chart of accounts  ·P7
- [ ] Expense management (record + categorize)  ·P7
- [ ] Payroll & salary (automated monthly calculation)  ·P7
- [ ] Cash In / Cash Out + daily cash book  ·P7
- [ ] Cash closing reports per branch per day  ·P7
- [ ] Bank account management + reconciliation  ·P7
- [ ] Accounts Receivable (invoices, payments, aging)  ·P7
- [ ] Accounts Payable (bills, payments, aging)  ·P7
- [ ] Trial Balance  ·P7
- [ ] Profit & Loss (monthly/quarterly/annual)  ·P7
- [ ] Balance Sheet (real-time)  ·P7
- [ ] Cash Flow Statement  ·P7
- [ ] Multi-branch consolidated financial reporting  ·P7
- [ ] Audit logs for all financial transactions  ·P7

## Phase 8 — Reports & analytics
- [ ] Daily sales report (branch / cashier / payment method)  ·P8
- [ ] Weekly & monthly sales summaries  ·P8
- [ ] Product profitability (margin per product/category)  ·P8
- [ ] Best-selling products (quantity & revenue)  ·P8
- [ ] Slow-moving & dead stock reports  ·P8
- [ ] Branch-wise performance comparison  ·P8
- [ ] Expense reports by category & period  ·P8
- [ ] Supplier payment reports  ·P8
- [ ] Export all reports to PDF & Excel + WhatsApp share  ·P8

## Phase 9 — ZATCA Phase-2 (FATOORA)
- [ ] Device onboarding (CSR, compliance + production CSIDs)  ·P9
- [ ] Simplified tax invoice (B2C) with QR at POS  ·P9
- [ ] Standard tax invoice (B2B) UBL 2.1 XML + cryptographic stamp  ·P9
- [ ] Clearance / reporting via ZATCA APIs  ·P9
- [ ] 15% VAT handling + VAT-return support + TRN on invoices  ·P9

## Phase 10 — Mobile & cloud access
- [ ] Mobile app (Android + iOS) for owner/management  ·P10
- [ ] Real-time sales & inventory monitoring from mobile  ·P10
- [ ] Approve POs & stock transfers from mobile  ·P10
- [ ] Token-auth API surface for mobile  ·P10

## Phase 11 — Deployment, security, hardening
- [ ] Cloud deployment (client-provided hosting)  ·P11
- [ ] Encrypted automated daily backups  ·P11
- [ ] SSL + RBAC review  ·P11
- [ ] AES encryption at rest for sensitive fields  ·P11
- [ ] SMS + email notification gateways (Twilio/SMTP) — wire the stubbed low-stock/near-expiry/alert channels  ·P11
- [ ] Demo/seed data for the 8 demo scenarios  ·P11
- [ ] UAT + go-live + hypercare  ·P11

## Cross-cutting / multi-branch (delivered across P1, P3, P7, P8)
- [ ] Centralized management of all branches from one login  ·P1
- [ ] Individual branch dashboards with data isolation  ·P1
- [ ] Stock transfers between branches (request/approve)  ·P3
- [ ] Branch-wise sales/inventory/financial reporting  ·P8
- [ ] Consolidated company-level reporting  ·P7
- [ ] New branch setup without extra dev (within license)  ·P1
- [ ] Role-based branch visibility (manager = own branch, owner = all)  ·P1
