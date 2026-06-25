<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\ProductRequest;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\TaxRate;
use App\Models\Unit;
use App\Support\ImageOptimizer;
use App\Support\Money;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();

        $products = Product::query()
            ->with(['category:id,name', 'unit:id,code', 'taxRate:id,name,rate'])
            ->when($search, fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%")
                ->orWhere('barcode', 'like', "%{$search}%")))
            ->when($request->integer('category_id'), fn ($q, $id) => $q->where('category_id', $id))
            ->when($request->string('status')->toString() === 'active', fn ($q) => $q->where('is_active', true))
            ->when($request->string('status')->toString() === 'inactive', fn ($q) => $q->where('is_active', false))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'barcode' => $p->barcode,
                'image_url' => $p->imageUrl(),
                'category' => $p->category?->name,
                'unit' => $p->unit?->code,
                'tax' => $p->taxRate ? (float) $p->taxRate->rate : null,
                'sell_price_minor' => $p->sell_price_minor,
                'is_weight_based' => $p->is_weight_based,
                'is_active' => $p->is_active,
            ]);

        return Inertia::render('MasterData/Products/Index', [
            'products' => $products,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'category_id' => $request->integer('category_id') ?: null,
                'status' => $request->string('status')->toString() ?: null,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('MasterData/Products/Form', $this->formData());
    }

    public function store(ProductRequest $request)
    {
        DB::transaction(function () use ($request) {
            $product = Product::create($this->attributes($request));
            $product->branches()->sync($this->branchPivot($request));
            $this->syncImage($request, $product);
        });

        return redirect()->route('master-data.products.index')->with('success', 'Product created.');
    }

    public function edit(Product $product)
    {
        $product->load('branches');

        return Inertia::render('MasterData/Products/Form', $this->formData($product));
    }

    public function update(ProductRequest $request, Product $product)
    {
        DB::transaction(function () use ($request, $product) {
            $product->update($this->attributes($request));
            $product->branches()->sync($this->branchPivot($request));
            $this->syncImage($request, $product);
        });

        return redirect()->route('master-data.products.index')->with('success', 'Product updated.');
    }

    public function destroy(Product $product)
    {
        $this->deleteImage($product->image_path);
        $product->delete();

        return back()->with('success', 'Product deleted.');
    }

    /** Print-friendly shelf/price label with barcode + QR. */
    public function label(Product $product)
    {
        $company = $product->company;

        return Inertia::render('MasterData/Products/Label', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'sell_price_minor' => $product->sell_price_minor,
                'unit' => $product->unit?->code,
                'is_weight_based' => $product->is_weight_based,
            ],
            'store' => ['name' => $company?->name, 'currency' => $company?->currency ?? 'SAR'],
        ]);
    }

    // ---- Helpers -----------------------------------------------------------

    /** Map validated request → product column values (money major → minor). */
    private function attributes(ProductRequest $request): array
    {
        return [
            'name' => $request->string('name'),
            'sku' => $request->input('sku') ?: null,
            'barcode' => $request->input('barcode') ?: null,
            'category_id' => $request->integer('category_id') ?: null,
            'unit_id' => $request->integer('unit_id') ?: null,
            'tax_rate_id' => $request->integer('tax_rate_id') ?: null,
            'cost_price_minor' => Money::toMinor($request->input('cost_price')),
            'sell_price_minor' => Money::toMinor($request->input('sell_price')),
            'is_weight_based' => $request->boolean('is_weight_based'),
            'reorder_level' => $request->input('reorder_level') ?: 0,
            'is_active' => $request->boolean('is_active', true),
        ];
    }

    /**
     * Store a newly uploaded (optimized) image, or clear the existing one when
     * remove_image is set. A no-op when neither is present, so editing other
     * fields never disturbs the photo.
     */
    private function syncImage(ProductRequest $request, Product $product): void
    {
        if ($request->hasFile('image')) {
            $new = ImageOptimizer::store($request->file('image'));
            $this->deleteImage($product->image_path);
            $product->update(['image_path' => $new]);
        } elseif ($request->boolean('remove_image')) {
            $this->deleteImage($product->image_path);
            $product->update(['image_path' => null]);
        }
    }

    private function deleteImage(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    /** Build the branch pivot map for sync() from the submitted branch rows. */
    private function branchPivot(ProductRequest $request): array
    {
        $pivot = [];
        foreach ($request->input('branches', []) as $row) {
            $price = $row['price'] ?? null;
            $pivot[(int) $row['branch_id']] = [
                'min_stock_level' => $row['min_stock_level'] ?? 0,
                'price_minor' => ($price === null || $price === '') ? null : Money::toMinor($price),
                'is_active' => (bool) ($row['stocked'] ?? false),
            ];
        }

        return $pivot;
    }

    /** Shared create/edit page props. */
    private function formData(?Product $product = null): array
    {
        $overrides = $product
            ? $product->branches->keyBy('id')
            : collect();

        $branches = Branch::query()
            ->where('company_id', request()->user()->company_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(function (Branch $b) use ($overrides) {
                $o = $overrides->get($b->id);

                return [
                    'branch_id' => $b->id,
                    'name' => $b->name,
                    'code' => $b->code,
                    'stocked' => $o ? (bool) $o->pivot->is_active : true,
                    'min_stock_level' => $o ? (float) $o->pivot->min_stock_level : 0,
                    'price' => $o && $o->pivot->price_minor !== null ? Money::toMajor($o->pivot->price_minor) : '',
                ];
            });

        return [
            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'category_id' => $product->category_id,
                'unit_id' => $product->unit_id,
                'tax_rate_id' => $product->tax_rate_id,
                'cost_price' => Money::toMajor($product->cost_price_minor),
                'sell_price' => Money::toMajor($product->sell_price_minor),
                'is_weight_based' => $product->is_weight_based,
                'reorder_level' => (float) $product->reorder_level,
                'is_active' => $product->is_active,
                'image_url' => $product->imageUrl(),
            ] : null,
            'categories' => Category::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'units' => Unit::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),
            'taxRates' => TaxRate::where('is_active', true)->orderBy('name')->get(['id', 'name', 'rate']),
            'branches' => $branches,
        ];
    }
}
