<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TaxRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route is gated by can:settings.manage
    }

    public function rules(): array
    {
        $companyId = $this->user()->company_id;
        $id = $this->route('taxRate')?->id;

        return [
            'name' => [
                'required', 'string', 'max:191',
                Rule::unique('tax_rates', 'name')->where('company_id', $companyId)->ignore($id),
            ],
            'rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'is_default' => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }
}
