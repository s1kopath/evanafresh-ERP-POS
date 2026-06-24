# CLAUDE.md — EIBMS (Evana Fresh Integrated Business Management System)

Instructions for any future session working in this repo. Read this first.

## What this project is
A cloud-based **ERP + POS** for **Evana Fresh**, a multi-branch retail grocery in
Jeddah, Saudi Arabia. One platform for POS/sales, inventory + expiry, purchasing +
reorder, customer/supplier ledgers, accounting, multi-branch management, reporting, and
**ZATCA Phase-2 e-invoicing**.

- **Feature catalog & progress (source of truth):** [docs/FEATURE-CHECKLIST.md](docs/FEATURE-CHECKLIST.md) — full feature list + tick state
- **Build plan (phased, step-by-step):** [docs/DEVELOPMENT-PLAN.md](docs/DEVELOPMENT-PLAN.md)

## How to work each session
1. Open `docs/FEATURE-CHECKLIST.md`, pick the next unchecked group (follow the
   recommended order in the plan: P1 → P2 → P3 → P4a → P6 → P5 → P7 → P8 → P4b → P9 → P10 → P11).
2. Read that phase's section in `docs/DEVELOPMENT-PLAN.md`.
3. Build the **vertical slice**: migration → model → controller/request/policy → Inertia page.
4. Replace the matching **module stub** in `resources/js/Pages/` with the real screen.
5. Tick the checklist items, update phase status, make sure `npm run build` and
   `php artisan migrate` both pass.
6. Commit.

## Stack (already installed — Phase 0 done)
- **Laravel 13.8** (PHP 8.3), **Inertia** (`inertiajs/inertia-laravel` v3).
- **React 19** + `@inertiajs/react`, **Vite 8**, **Tailwind v4** (`@tailwindcss/vite`).
- **DB:** SQLite for dev (`database/database.sqlite`); **MySQL** for production.
  Offline POS uses a local store on the device (Phase 4b).
- Frontend is **JavaScript / JSX — not TypeScript**.

## Run it
```bash
composer dev          # serve + queue + logs + vite (all-in-one)
# or, separately:
php artisan serve
npm run dev           # Vite dev server (HMR)
npm run build         # production assets
php artisan migrate
```
If `public/hot` exists but no Vite dev server is running, delete it (it forces dev-mode
asset loading). `npm run build` produces the manifest used in production.

## Repo map
```
app/Http/Middleware/HandleInertiaRequests.php   # shared Inertia props (app, auth, flash)
bootstrap/app.php                               # middleware registration (Laravel 13 style)
routes/web.php                                  # one Inertia route per screen (closures for now)
resources/views/app.blade.php                   # Inertia root template
resources/js/app.jsx                            # Inertia client entry (page resolver, @ alias)
resources/js/Layouts/AppLayout.jsx              # sidebar + topbar shell
resources/js/Components/                         # NavLink, StatCard, ModuleStub, …
resources/js/Pages/                              # Inertia pages (Dashboard + module stubs)
docs/                                            # PROPOSAL, DEVELOPMENT-PLAN, FEATURE-CHECKLIST
```

## Conventions
### Frontend
- Pages live in `resources/js/Pages/<Module>/<Name>.jsx`; route them from `web.php` via
  `Inertia::render('Module/Name')`.
- Use the `@` alias for `resources/js` (e.g. `@/Layouts/AppLayout`, `@/Components/StatCard`).
- Wrap screens in `AppLayout` (`title`, `subtitle`, `actions` props). POS terminal may use
  a dedicated full-screen layout later.
- Brand colors are Tailwind tokens: `brand-50 … brand-900` (defined in `resources/css/app.css`).
- Module stubs (`Components/ModuleStub.jsx`) double as living specs — replace them as you build.

### Shared UI kit (use these — don't reinvent)
Reusable components live in `resources/js/Components/ui/`. Open **`/ui-kit`** in the app for a
live reference of all of them.
- `Button` (`variant`, `size`, `loading`) + `buttonVariants()` for styled `<Link>`s.
- `Card`, `Badge`, `EmptyState`, `Spinner`.
- `Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonTable` — show while data loads.
- `Modal` + `ConfirmDialog` — bottom-sheet on mobile, centered on desktop; Esc/backdrop close.
- Form: `FormField`, `Input`, `Select`, `Textarea`, `InputError`, `Label` — pair with Inertia `useForm`.
- `Pagination` — feed it a Laravel paginator's `links` array.
- **Toasts:** `useToast()` → `.success/.error/.warning/.info(message, { title?, duration? })`.
  `ToastProvider` wraps the app in `app.jsx`; `flash.success` / `flash.error` from Laravel
  auto-toast via `useFlashToasts()` (already called in `AppLayout`). So
  `return back()->with('success', '…')` from a controller just works.
- **Page-load progress bar:** Inertia's built-in NProgress, configured in `app.jsx`
  (`progress: { color, showSpinner:false }`) — shows on every navigation, no extra code.
- Helpers: `@/lib/cn` (classnames) and `@/lib/format` (`formatMoney` (SAR), `formatNumber`,
  `formatDate`, `formatDateTime`).
- **Layout is responsive:** sidebar is a static rail on `lg+` and an off-canvas drawer below
  `lg` (hamburger in the topbar). Keep new screens mobile-first; test at a narrow width.

### Backend
- Laravel 13 structure: register middleware in `bootstrap/app.php` (no `Kernel.php`).
- Each module: controller + FormRequest + Policy. Keep business logic in service classes
  (e.g. `App\Services\Sales\SaleService`).
- **Branch scoping:** almost every table has `branch_id`; enforce isolation with a global
  scope + the current-branch context. Owners bypass to see all branches.
- **Money:** never floats. Use `decimal(15,2)` or integer minor units (halalas). Currency
  **SAR**, VAT **15%**. One money helper per side.
- **Stock:** model every change as an immutable `stock_movements` row; `stock_levels` is a
  cached projection. Valuation default = weighted average.
- **Ledgers:** append-only; corrections are reversing entries; every financial write logs audit.
- **Portable SQL:** must run on both SQLite (dev) and MySQL (prod). Prefer Eloquent/builder
  over raw engine-specific SQL.
- **Documents:** per-branch sequential numbers (invoice/GRN/PO), generated transactionally.

## Hard product constraints — do not violate
- **English only.** No Arabic, no RTL, no i18n scaffolding.
- **ZATCA Phase-2** compliance for invoicing (B2C QR + B2B UBL 2.1 XML) — Phase 9.
- **Offline-first POS** — sales must work with no internet and sync idempotently (Phase 4b).
- **Multi-branch** isolation + consolidation throughout.

## Decisions log
- Frontend: **JavaScript/JSX**, not TypeScript (per owner).
- Dev DB: **SQLite**; prod: **MySQL**.
- **Auth is deferred to Phase 1** — current routes are open closures.
- Brand palette derived from the original proposal (green).
- The proposal document, wireframe, and PDF were intentionally removed. The feature list now
  lives in `docs/FEATURE-CHECKLIST.md`. **Do not re-add proposal pages to the app.**
