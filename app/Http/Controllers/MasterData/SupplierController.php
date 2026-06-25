<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\SupplierRequest;
use App\Models\Supplier;
use App\Support\Money;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();

        $suppliers = Supplier::query()
            ->when($search, fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%{$search}%")
                ->orWhere('contact_name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Supplier $s) => [
                'id' => $s->id,
                'name' => $s->name,
                'contact_name' => $s->contact_name,
                'phone' => $s->phone,
                'email' => $s->email,
                'address' => $s->address,
                'trn' => $s->trn,
                'opening_balance' => Money::toMajor($s->opening_balance_minor),
                'is_active' => $s->is_active,
            ]);

        return Inertia::render('MasterData/Suppliers', [
            'suppliers' => $suppliers,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(SupplierRequest $request)
    {
        Supplier::create($this->attributes($request));

        return back()->with('success', 'Supplier created.');
    }

    public function update(SupplierRequest $request, Supplier $supplier)
    {
        $supplier->update($this->attributes($request));

        return back()->with('success', 'Supplier updated.');
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();

        return back()->with('success', 'Supplier deleted.');
    }

    private function attributes(SupplierRequest $request): array
    {
        return [
            'name' => $request->string('name'),
            'contact_name' => $request->input('contact_name'),
            'phone' => $request->input('phone'),
            'email' => $request->input('email'),
            'address' => $request->input('address'),
            'trn' => $request->input('trn'),
            'opening_balance_minor' => Money::toMinor($request->input('opening_balance')),
            'is_active' => $request->boolean('is_active', true),
        ];
    }
}
