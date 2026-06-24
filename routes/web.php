<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes — Evana Fresh ERP + POS
|--------------------------------------------------------------------------
| Phase 0: app shell + stubs. Every screen below is currently an Inertia
| page rendered from a closure. As we build each module (see docs/DEVELOPMENT-PLAN.md)
| these closures are replaced by controllers backed by real data.
*/

Route::get('/', function () {
    return Inertia::render('Dashboard', [
        // Illustrative month-end figures from the client proposal (Section 5).
        // Replaced by live aggregates once Accounting + Reports are built.
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
Route::get('/purchasing', fn () => Inertia::render('Purchasing/Index'))->name('purchasing');

// Finance
Route::get('/ledgers/customers', fn () => Inertia::render('Ledgers/Customers'))->name('ledgers.customers');
Route::get('/ledgers/suppliers', fn () => Inertia::render('Ledgers/Suppliers'))->name('ledgers.suppliers');
Route::get('/accounting', fn () => Inertia::render('Accounting/Index'))->name('accounting');

// Insights
Route::get('/reports', fn () => Inertia::render('Reports/Index'))->name('reports');

// Admin
Route::get('/settings', fn () => Inertia::render('Settings/Index'))->name('settings');

// Developer — living reference for the shared UI components (resources/js/Components/ui).
Route::get('/ui-kit', fn () => Inertia::render('UiKit'))->name('ui-kit');
