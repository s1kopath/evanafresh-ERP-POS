<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route is gated by can:masterdata.manage
    }

    public function rules(): array
    {
        $companyId = $this->user()->company_id;
        $id = $this->route('unit')?->id;

        return [
            'name' => ['required', 'string', 'max:191'],
            'code' => [
                'required', 'string', 'max:16',
                Rule::unique('units', 'code')->where('company_id', $companyId)->ignore($id),
            ],
            'is_fractional' => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }
}
