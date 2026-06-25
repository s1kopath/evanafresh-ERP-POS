<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\BranchSwitchController;
use App\Http\Controllers\MasterData\CategoryController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\MasterData\TaxRateController;
use App\Http\Controllers\MasterData\CustomerController;
use App\Http\Controllers\MasterData\EmployeeController;
use App\Http\Controllers\MasterData\ImportController;
use App\Http\Controllers\MasterData\MasterDataController;
use App\Http\Controllers\MasterData\ProductController;
use App\Http\Controllers\MasterData\SupplierController;
use App\Http\Controllers\MasterData\UnitConversionController;
use App\Http\Controllers\MasterData\UnitController;
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

    // Admin — Master Data (Phase 2). Company-wide catalogue + parties.
    Route::middleware('can:masterdata.manage')
        ->prefix('master-data')
        ->name('master-data.')
        ->group(function () {
            Route::get('/', [MasterDataController::class, 'index'])->name('index');

            Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
            Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
            Route::put('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
            Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

            Route::get('units', [UnitController::class, 'index'])->name('units.index');
            Route::post('units', [UnitController::class, 'store'])->name('units.store');
            Route::put('units/{unit}', [UnitController::class, 'update'])->name('units.update');
            Route::delete('units/{unit}', [UnitController::class, 'destroy'])->name('units.destroy');
            Route::post('unit-conversions', [UnitConversionController::class, 'store'])->name('unit-conversions.store');
            Route::delete('unit-conversions/{conversion}', [UnitConversionController::class, 'destroy'])->name('unit-conversions.destroy');

            Route::get('products/{product}/label', [ProductController::class, 'label'])->name('products.label');
            Route::resource('products', ProductController::class)->except(['show']);

            // Parties — modal CRUD (index + store/update/destroy).
            Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
            Route::post('customers', [CustomerController::class, 'store'])->name('customers.store');
            Route::put('customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
            Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');

            Route::get('suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
            Route::post('suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
            Route::put('suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
            Route::delete('suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');

            Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
            Route::post('employees', [EmployeeController::class, 'store'])->name('employees.store');
            Route::put('employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
            Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');

            // Opening-data CSV import (products / customers / suppliers).
            Route::get('import', [ImportController::class, 'create'])->name('import');
            Route::get('import/{type}/template', [ImportController::class, 'template'])->name('import.template');
            Route::post('import/{type}', [ImportController::class, 'store'])->name('import.store');
        });

    Route::get('/branches', fn () => Inertia::render('Branches/Index'))->name('branches');

    // Settings (Phase 2) — store header, VAT/TRN, thresholds, tax-rate config.
    Route::middleware('can:settings.manage')
        ->prefix('settings')
        ->name('settings.')
        ->group(function () {
            Route::get('/', [SettingsController::class, 'index'])->name('index');
            Route::put('/', [SettingsController::class, 'update'])->name('update');

            Route::post('tax-rates', [TaxRateController::class, 'store'])->name('tax-rates.store');
            Route::put('tax-rates/{taxRate}', [TaxRateController::class, 'update'])->name('tax-rates.update');
            Route::delete('tax-rates/{taxRate}', [TaxRateController::class, 'destroy'])->name('tax-rates.destroy');
        });

    // Developer — living reference for the shared UI components.
    Route::get('/ui-kit', fn () => Inertia::render('UiKit'))->name('ui-kit');
});
