<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UnitConversionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route is gated by can:masterdata.manage
    }

    public function rules(): array
    {
        $companyId = $this->user()->company_id;
        $unitExists = fn () => Rule::exists('units', 'id')->where('company_id', $companyId);

        return [
            'from_unit_id' => ['required', 'integer', $unitExists()],
            'to_unit_id' => ['required', 'integer', 'different:from_unit_id', $unitExists()],
            'factor' => ['required', 'numeric', 'gt:0'],
        ];
    }
}
