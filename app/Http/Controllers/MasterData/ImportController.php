<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\TaxRate;
use App\Models\Unit;
use App\Support\Money;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ImportController extends Controller
{
    /** Column specs per importable entity: [key, label, required, example]. */
    private const SPECS = [
        'products' => [
            ['name', 'Name', true, 'Fresh Bananas'],
            ['barcode', 'Barcode', false, '6281000000017'],
            ['sku', 'SKU', false, 'PRD-001'],
            ['category', 'Category', false, 'Produce'],
            ['unit', 'Unit code', false, 'kg'],
            ['tax_rate', 'Tax rate name/%', false, 'Standard VAT'],
            ['sell_price', 'Sell price (SAR)', true, '5.50'],
            ['cost_price', 'Cost price (SAR)', false, '3.20'],
            ['is_weight_based', 'Weight-based (yes/no)', false, 'yes'],
            ['reorder_level', 'Reorder level', false, '15'],
        ],
        'customers' => [
            ['name', 'Name', true, 'Al Noor Restaurant'],
            ['phone', 'Phone', false, '+966 55 100 1001'],
            ['email', 'Email', false, 'orders@alnoor.test'],
            ['address', 'Address', false, 'King Rd, Jeddah'],
            ['credit_limit', 'Credit limit (SAR)', false, '5000'],
            ['opening_balance', 'Opening balance (SAR)', false, '1250'],
        ],
        'suppliers' => [
            ['name', 'Name', true, 'Jeddah Fresh Produce Co.'],
            ['contact_name', 'Contact person', false, 'Khalid'],
            ['phone', 'Phone', false, '+966 12 200 2001'],
            ['email', 'Email', false, 'sales@jfp.test'],
            ['address', 'Address', false, 'Industrial City, Jeddah'],
            ['trn', 'VAT number', false, '310111111100003'],
            ['opening_balance', 'Opening balance (SAR)', false, '12400'],
        ],
    ];

    public function create(Request $request)
    {
        $type = $this->type($request->string('type')->toString());

        return Inertia::render('MasterData/Import', [
            'type' => $type,
            'types' => array_keys(self::SPECS),
            'columns' => collect(self::SPECS[$type])->map(fn ($c) => [
                'key' => $c[0], 'label' => $c[1], 'required' => $c[2], 'example' => $c[3],
            ]),
            'summary' => session('importSummary'),
        ]);
    }

    /** Download a CSV template (header row + one example row). */
    public function template(string $type): StreamedResponse
    {
        $type = $this->type($type);
        $spec = self::SPECS[$type];

        return response()->streamDownload(function () use ($spec) {
            $out = fopen('php://output', 'w');
            fputcsv($out, array_map(fn ($c) => $c[0], $spec));
            fputcsv($out, array_map(fn ($c) => $c[3], $spec));
            fclose($out);
        }, "{$type}-template.csv", ['Content-Type' => 'text/csv']);
    }

    public function store(Request $request, string $type)
    {
        $type = $this->type($type);
        $request->validate(['file' => ['required', 'file', 'max:5120']]);

        $rows = $this->parse($request->file('file')->getRealPath());
        $header = array_map(
            fn ($h) => str_replace(' ', '_', strtolower(trim((string) $h))),
            array_shift($rows) ?? [],
        );

        $summary = ['created' => 0, 'updated' => 0, 'skipped' => 0, 'errors' => []];
        $handler = [$this, 'import'.ucfirst($type)];

        foreach ($rows as $i => $raw) {
            if (count(array_filter($raw, fn ($v) => trim((string) $v) !== '')) === 0) {
                continue; // blank line
            }
            $row = $this->assoc($header, $raw);
            try {
                $result = $handler($row);
                $summary[$result]++;
            } catch (\Throwable $e) {
                $summary['skipped']++;
                $summary['errors'][] = ['line' => $i + 2, 'message' => $e->getMessage()];
            }
        }

        $msg = "Imported {$summary['created']} new, updated {$summary['updated']}, skipped {$summary['skipped']}.";

        return redirect()->route('master-data.import', ['type' => $type])
            ->with('success', $msg)
            ->with('importSummary', $summary);
    }

    // ---- Per-type row importers (return 'created' | 'updated') -------------

    private function importProducts(array $row): string
    {
        $name = trim((string) ($row['name'] ?? ''));
        if ($name === '') {
            throw new \RuntimeException('Missing product name.');
        }
        if (! is_numeric($row['sell_price'] ?? null)) {
            throw new \RuntimeException('Missing or invalid sell price.');
        }

        $companyId = $this->companyId();
        $category = $this->resolveCategory($row['category'] ?? null);
        $unit = $this->lookup(Unit::class, 'code', $row['unit'] ?? null);
        $tax = $this->resolveTax($row['tax_rate'] ?? null);

        // Upsert key: barcode → sku → name.
        $key = ! empty($row['barcode'])
            ? ['barcode' => trim($row['barcode'])]
            : (! empty($row['sku']) ? ['sku' => trim($row['sku'])] : ['name' => $name]);

        $existing = Product::where($key)->first();

        $product = Product::updateOrCreate(
            ['company_id' => $companyId] + $key,
            [
                'name' => $name,
                'sku' => ($row['sku'] ?? null) ?: ($existing->sku ?? null),
                'barcode' => ($row['barcode'] ?? null) ?: ($existing->barcode ?? null),
                'category_id' => $category?->id,
                'unit_id' => $unit?->id,
                'tax_rate_id' => $tax?->id,
                'sell_price_minor' => Money::toMinor($row['sell_price']),
                'cost_price_minor' => Money::toMinor($row['cost_price'] ?? 0),
                'is_weight_based' => $this->bool($row['is_weight_based'] ?? false),
                'reorder_level' => is_numeric($row['reorder_level'] ?? null) ? $row['reorder_level'] : 0,
                'is_active' => true,
            ],
        );

        return $product->wasRecentlyCreated ? 'created' : 'updated';
    }

    private function importCustomers(array $row): string
    {
        $name = trim((string) ($row['name'] ?? ''));
        if ($name === '') {
            throw new \RuntimeException('Missing customer name.');
        }

        $customer = Customer::updateOrCreate(
            ['company_id' => $this->companyId(), 'name' => $name],
            [
                'phone' => $row['phone'] ?? null,
                'email' => $row['email'] ?? null,
                'address' => $row['address'] ?? null,
                'credit_limit_minor' => Money::toMinor($row['credit_limit'] ?? 0),
                'opening_balance_minor' => Money::toMinor($row['opening_balance'] ?? 0),
                'is_active' => true,
            ],
        );

        return $customer->wasRecentlyCreated ? 'created' : 'updated';
    }

    private function importSuppliers(array $row): string
    {
        $name = trim((string) ($row['name'] ?? ''));
        if ($name === '') {
            throw new \RuntimeException('Missing supplier name.');
        }

        $supplier = Supplier::updateOrCreate(
            ['company_id' => $this->companyId(), 'name' => $name],
            [
                'contact_name' => $row['contact_name'] ?? null,
                'phone' => $row['phone'] ?? null,
                'email' => $row['email'] ?? null,
                'address' => $row['address'] ?? null,
                'trn' => $row['trn'] ?? null,
                'opening_balance_minor' => Money::toMinor($row['opening_balance'] ?? 0),
                'is_active' => true,
            ],
        );

        return $supplier->wasRecentlyCreated ? 'created' : 'updated';
    }

    // ---- Helpers -----------------------------------------------------------

    private function type(?string $type): string
    {
        return array_key_exists($type, self::SPECS) ? $type : 'products';
    }

    private function companyId(): int
    {
        return request()->user()->company_id;
    }

    private function parse(string $path): array
    {
        $rows = [];
        if (($h = fopen($path, 'r')) !== false) {
            while (($data = fgetcsv($h)) !== false) {
                $rows[] = $data;
            }
            fclose($h);
        }

        return $rows;
    }

    private function assoc(array $header, array $raw): array
    {
        $row = [];
        foreach ($header as $idx => $col) {
            if ($col === '') {
                continue;
            }
            $row[$col] = isset($raw[$idx]) ? trim((string) $raw[$idx]) : null;
        }

        return $row;
    }

    private function bool($value): bool
    {
        return in_array(strtolower((string) $value), ['1', 'yes', 'true', 'y'], true);
    }

    private function lookup(string $model, string $column, ?string $value)
    {
        $value = trim((string) $value);

        return $value === '' ? null : $model::where($column, $value)->first();
    }

    private function resolveCategory(?string $name): ?Category
    {
        $name = trim((string) $name);
        if ($name === '') {
            return null;
        }

        return Category::firstOrCreate(
            ['company_id' => $this->companyId(), 'name' => $name],
            ['is_active' => true],
        );
    }

    private function resolveTax(?string $value): ?TaxRate
    {
        $value = trim((string) $value);
        if ($value === '') {
            return TaxRate::where('is_default', true)->first();
        }

        return TaxRate::where('name', $value)->first()
            ?? (is_numeric($value) ? TaxRate::where('rate', (float) $value)->first() : null)
            ?? TaxRate::where('is_default', true)->first();
    }
}
