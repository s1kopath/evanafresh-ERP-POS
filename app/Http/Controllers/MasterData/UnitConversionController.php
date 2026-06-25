<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\UnitConversionRequest;
use App\Models\UnitConversion;

class UnitConversionController extends Controller
{
    public function store(UnitConversionRequest $request)
    {
        UnitConversion::create([
            'from_unit_id' => $request->integer('from_unit_id'),
            'to_unit_id' => $request->integer('to_unit_id'),
            'factor' => $request->input('factor'),
        ]);

        return back()->with('success', 'Conversion added.');
    }

    public function destroy(UnitConversion $conversion)
    {
        $conversion->delete();

        return back()->with('success', 'Conversion removed.');
    }
}
