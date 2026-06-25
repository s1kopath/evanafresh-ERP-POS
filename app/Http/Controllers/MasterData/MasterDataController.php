<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Unit;
use Inertia\Inertia;

class MasterDataController extends Controller
{
    /**
     * Master Data hub — entry cards into each catalogue/party section with counts.
     * Sections are added here as their modules land (parties in Wave B).
     */
    public function index()
    {
        $sections = [
            [
                'key' => 'products', 'label' => 'Products', 'icon' => 'products',
                'href' => route('master-data.products.index'),
                'count' => Product::count(),
                'desc' => 'Barcode, price, tax, weight flag, reorder level',
            ],
            [
                'key' => 'categories', 'label' => 'Categories', 'icon' => 'categories',
                'href' => route('master-data.categories.index'),
                'count' => Category::count(),
                'desc' => 'Grocery, dairy, produce, frozen, beverages, …',
            ],
            [
                'key' => 'units', 'label' => 'Units & Conversions', 'icon' => 'units',
                'href' => route('master-data.units.index'),
                'count' => Unit::count(),
                'desc' => 'kg, g, pcs, box — with conversion factors',
            ],
            [
                'key' => 'customers', 'label' => 'Customers', 'icon' => 'customers',
                'href' => route('master-data.customers.index'),
                'count' => Customer::count(),
                'desc' => 'Credit limit & opening balance',
            ],
            [
                'key' => 'suppliers', 'label' => 'Suppliers', 'icon' => 'suppliers',
                'href' => route('master-data.suppliers.index'),
                'count' => Supplier::count(),
                'desc' => 'Profile, VAT number & opening balance',
            ],
            [
                'key' => 'employees', 'label' => 'Employees', 'icon' => 'employees',
                'href' => route('master-data.employees.index'),
                'count' => Employee::count(),
                'desc' => 'Salary, join date, branch, status',
            ],
        ];

        return Inertia::render('MasterData/Index', ['sections' => $sections]);
    }
}
