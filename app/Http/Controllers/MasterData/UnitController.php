<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\UnitRequest;
use App\Models\Unit;
use App\Models\UnitConversion;
use Inertia\Inertia;

class UnitController extends Controller
{
    public function index()
    {
        return Inertia::render('MasterData/Units', [
            'units' => Unit::withCount('products')->orderBy('name')->get(),
            'conversions' => UnitConversion::with(['fromUnit:id,code,name', 'toUnit:id,code,name'])
                ->get()
                ->map(fn (UnitConversion $c) => [
                    'id' => $c->id,
                    'from_unit_id' => $c->from_unit_id,
                    'to_unit_id' => $c->to_unit_id,
                    'factor' => $c->factor,
                    'from' => $c->fromUnit?->code,
                    'to' => $c->toUnit?->code,
                ]),
        ]);
    }

    public function store(UnitRequest $request)
    {
        Unit::create([
            'name' => $request->string('name'),
            'code' => $request->string('code'),
            'is_fractional' => $request->boolean('is_fractional'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Unit created.');
    }

    public function update(UnitRequest $request, Unit $unit)
    {
        $unit->update([
            'name' => $request->string('name'),
            'code' => $request->string('code'),
            'is_fractional' => $request->boolean('is_fractional'),
            'is_active' => $request->boolean('is_active'),
        ]);

        return back()->with('success', 'Unit updated.');
    }

    public function destroy(Unit $unit)
    {
        if ($unit->products()->exists()) {
            return back()->with('error', 'Cannot delete a unit that is assigned to products.');
        }

        $unit->delete();

        return back()->with('success', 'Unit deleted.');
    }
}
