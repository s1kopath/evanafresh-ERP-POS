<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\TaxRate;
use App\Models\Unit;
use App\Models\UnitConversion;
use App\Support\Money;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::first();
        if (! $company) {
            return; // OrgSeeder must run first
        }
        $cid = $company->id;
        $branches = Branch::where('company_id', $cid)->get();

        // ---- Tax rates -----------------------------------------------------
        $standard = TaxRate::updateOrCreate(
            ['company_id' => $cid, 'name' => 'Standard VAT'],
            ['rate' => 15.00, 'is_default' => true, 'is_active' => true],
        );
        TaxRate::updateOrCreate(
            ['company_id' => $cid, 'name' => 'Zero-rated'],
            ['rate' => 0, 'is_default' => false, 'is_active' => true],
        );

        // ---- Units + conversions -------------------------------------------
        $unit = fn (string $code, string $name, bool $frac) => Unit::updateOrCreate(
            ['company_id' => $cid, 'code' => $code],
            ['name' => $name, 'is_fractional' => $frac, 'is_active' => true],
        );
        $kg = $unit('kg', 'Kilogram', true);
        $g = $unit('g', 'Gram', true);
        $pcs = $unit('pcs', 'Piece', false);
        $box = $unit('box', 'Box', false);

        UnitConversion::updateOrCreate(['from_unit_id' => $kg->id, 'to_unit_id' => $g->id], ['company_id' => $cid, 'factor' => 1000]);
        UnitConversion::updateOrCreate(['from_unit_id' => $box->id, 'to_unit_id' => $pcs->id], ['company_id' => $cid, 'factor' => 12]);

        // ---- Categories ----------------------------------------------------
        $categories = [];
        foreach (['Grocery', 'Dairy', 'Produce', 'Frozen', 'Beverages'] as $name) {
            $categories[$name] = Category::updateOrCreate(
                ['company_id' => $cid, 'name' => $name],
                ['is_active' => true],
            );
        }

        // ---- Products ------------------------------------------------------
        // [name, barcode, category, unit, sell SAR, cost SAR, weight?, reorder]
        $products = [
            ['Fresh Bananas', '6281000000017', 'Produce', $kg, 5.50, 3.20, true, 15],
            ['Red Apples', '6281000000024', 'Produce', $kg, 8.00, 5.40, true, 12],
            ['Full Cream Milk 1L', '6281000000031', 'Dairy', $pcs, 6.00, 4.10, false, 24],
            ['Greek Yoghurt 500g', '6281000000048', 'Dairy', $pcs, 9.50, 6.30, false, 18],
            ['Mineral Water 600ml', '6281000000055', 'Beverages', $pcs, 1.50, 0.80, false, 60],
            ['Orange Juice 1L', '6281000000062', 'Beverages', $pcs, 7.25, 4.90, false, 20],
            ['Frozen Peas 400g', '6281000000079', 'Frozen', $pcs, 6.75, 4.20, false, 16],
            ['Frozen Mixed Veg 1kg', '6281000000086', 'Frozen', $pcs, 12.00, 8.10, false, 12],
            ['Basmati Rice 5kg', '6281000000093', 'Grocery', $pcs, 45.00, 35.00, false, 10],
            ['White Sugar 1kg', '6281000000109', 'Grocery', $kg, 4.25, 2.80, false, 25],
        ];

        foreach ($products as [$name, $barcode, $cat, $u, $sell, $cost, $weight, $reorder]) {
            $product = Product::updateOrCreate(
                ['company_id' => $cid, 'barcode' => $barcode],
                [
                    'category_id' => $categories[$cat]->id,
                    'unit_id' => $u->id,
                    'tax_rate_id' => $standard->id,
                    'name' => $name,
                    'sell_price_minor' => Money::toMinor($sell),
                    'cost_price_minor' => Money::toMinor($cost),
                    'is_weight_based' => $weight,
                    'reorder_level' => $reorder,
                    'is_active' => true,
                ],
            );

            // Stock at every branch; min level defaults to the product reorder level.
            $pivot = $branches->mapWithKeys(fn (Branch $b) => [
                $b->id => ['min_stock_level' => $reorder, 'price_minor' => null, 'is_active' => true],
            ])->all();
            $product->branches()->sync($pivot);
        }

        // ---- Parties -------------------------------------------------------
        $b1 = $branches->firstWhere('code', 'B1');

        $customers = [
            ['Al Noor Restaurant', '+966 55 100 1001', 5000.00, 1250.00],
            ['Sara Catering', '+966 55 100 1002', 3000.00, 0],
            ['Hassan Grocery', '+966 55 100 1003', 2000.00, 480.50],
        ];
        foreach ($customers as [$name, $phone, $limit, $opening]) {
            Customer::updateOrCreate(
                ['company_id' => $cid, 'name' => $name],
                [
                    'branch_id' => $b1?->id,
                    'phone' => $phone,
                    'credit_limit_minor' => Money::toMinor($limit),
                    'opening_balance_minor' => Money::toMinor($opening),
                    'is_active' => true,
                ],
            );
        }

        $suppliers = [
            ['Jeddah Fresh Produce Co.', 'Khalid', '+966 12 200 2001', '310111111100003', 12400.00],
            ['Gulf Dairy Distributors', 'Mona', '+966 12 200 2002', '310222222200003', 8650.00],
            ['National Beverage Supply', 'Tariq', '+966 12 200 2003', null, 0],
        ];
        foreach ($suppliers as [$name, $contact, $phone, $trn, $opening]) {
            Supplier::updateOrCreate(
                ['company_id' => $cid, 'name' => $name],
                [
                    'contact_name' => $contact,
                    'phone' => $phone,
                    'trn' => $trn,
                    'opening_balance_minor' => Money::toMinor($opening),
                    'is_active' => true,
                ],
            );
        }

        $employees = [
            ['Yusuf Cashier', 'EF-001', 'Cashier', 3500.00, '2024-01-15', 'active'],
            ['Layla Cashier', 'EF-002', 'Cashier', 3500.00, '2024-03-01', 'active'],
            ['Omar Manager', 'EF-003', 'Branch Manager', 8000.00, '2023-06-10', 'active'],
            ['Nadia Stock Clerk', 'EF-004', 'Stock Clerk', 3000.00, '2024-09-20', 'on_leave'],
        ];
        foreach ($employees as [$name, $no, $position, $salary, $joined, $status]) {
            Employee::updateOrCreate(
                ['company_id' => $cid, 'employee_no' => $no],
                [
                    'branch_id' => $b1?->id,
                    'name' => $name,
                    'position' => $position,
                    'salary_minor' => Money::toMinor($salary),
                    'joined_on' => $joined,
                    'status' => $status,
                ],
            );
        }
    }
}
