<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\BranchSwitchController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes — Evana Fresh ERP + POS
|--------------------------------------------------------------------------
| Phase 1: session auth + RBAC + branch scoping. The app screens below are
| still Inertia stubs rendered from closures; each is replaced by a real
| controller as its module is built (see docs/DEVELOPMENT-PLAN.md).
*/

// ---- Guest ----------------------------------------------------------------
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
});

// ---- Authenticated app ----------------------------------------------------
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::post('/branch/switch', [BranchSwitchController::class, 'update'])->name('branch.switch');

    Route::get('/', function () {
        return Inertia::render('Dashboard', [
            // Illustrative month-end figures. Replaced by live aggregates once
            // Accounting + Reports are built.
            'currency' => 'SAR',
            'kpis' => [
                ['label' => 'Total Sales', 'value' => 487200, 'tone' => 'brand'],
                ['label' => 'Net Profit', 'value' => 84800, 'tone' => 'brand'],
                ['label' => 'Total Expenses', 'value' => 38400, 'tone' => 'slate'],
                ['label' => 'Payroll Expenses', 'value' => 52000, 'tone' => 'slate'],
                ['label' => 'Accounts Receivable', 'value' => 64300, 'tone' => 'amber'],
                ['label' => 'Accounts Payable', 'value' => 121500, 'tone' => 'red'],
                ['label' => 'Supplier Payments', 'value' => 310000, 'tone' => 'slate'],
                ['label' => 'Inventory Value', 'value' => 215800, 'tone' => 'blue'],
            ],
        ]);
    })->name('dashboard');

    // Operations
    Route::get('/pos', fn () => Inertia::render('Pos/Index'))->name('pos');
    Route::get('/inventory', fn () => Inertia::render('Inventory/Index'))->name('inventory');
    Route::get('/expiry', fn () => Inertia::render('Inventory/Expiry'))->name('expiry');
    Route::get('/purchasing', fn () => Inertia::render('Purchasing/Index'))->name('purchasing');
    Route::get('/reorder', fn () => Inertia::render('Purchasing/Reorder'))->name('reorder');

    // Finance
    Route::get('/ledgers/customers', fn () => Inertia::render('Ledgers/Customers'))->name('ledgers.customers');
    Route::get('/ledgers/suppliers', fn () => Inertia::render('Ledgers/Suppliers'))->name('ledgers.suppliers');
    Route::get('/accounting', fn () => Inertia::render('Accounting/Index'))->name('accounting');
    Route::get('/payroll', fn () => Inertia::render('Accounting/Payroll'))->name('payroll');

    // Insights
    Route::get('/reports', fn () => Inertia::render('Reports/Index'))->name('reports');

    // Admin
    Route::get('/master-data', fn () => Inertia::render('MasterData/Index'))->name('master-data');
    Route::get('/branches', fn () => Inertia::render('Branches/Index'))->name('branches');
    Route::get('/settings', fn () => Inertia::render('Settings/Index'))->name('settings');

    // Developer — living reference for the shared UI components.
    Route::get('/ui-kit', fn () => Inertia::render('UiKit'))->name('ui-kit');
});
