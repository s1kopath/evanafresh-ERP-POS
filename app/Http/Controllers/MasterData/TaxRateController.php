<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\TaxRateRequest;
use App\Models\TaxRate;
use Illuminate\Support\Facades\DB;

class TaxRateController extends Controller
{
    public function store(TaxRateRequest $request)
    {
        DB::transaction(function () use ($request) {
            $rate = TaxRate::create([
                'name' => $request->string('name'),
                'rate' => $request->input('rate'),
                'is_default' => $request->boolean('is_default'),
                'is_active' => $request->boolean('is_active', true),
            ]);

            if ($rate->is_default) {
                TaxRate::where('id', '!=', $rate->id)->update(['is_default' => false]);
            }
        });

        return back()->with('success', 'Tax rate created.');
    }

    public function update(TaxRateRequest $request, TaxRate $taxRate)
    {
        DB::transaction(function () use ($request, $taxRate) {
            $taxRate->update([
                'name' => $request->string('name'),
                'rate' => $request->input('rate'),
                'is_default' => $request->boolean('is_default'),
                'is_active' => $request->boolean('is_active'),
            ]);

            if ($taxRate->is_default) {
                TaxRate::where('id', '!=', $taxRate->id)->update(['is_default' => false]);
            }
        });

        return back()->with('success', 'Tax rate updated.');
    }

    public function destroy(TaxRate $taxRate)
    {
        if ($taxRate->products()->exists()) {
            return back()->with('error', 'Cannot delete a tax rate that is assigned to products.');
        }

        $taxRate->delete();

        return back()->with('success', 'Tax rate deleted.');
    }
}
