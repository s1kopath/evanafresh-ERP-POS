<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route is gated by can:masterdata.manage
    }

    public function rules(): array
    {
        $companyId = $this->user()->company_id;

        return [
            'name' => ['required', 'string', 'max:191'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:191'],
            'address' => ['nullable', 'string', 'max:255'],
            'branch_id' => ['nullable', 'integer', Rule::exists('branches', 'id')->where('company_id', $companyId)],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'opening_balance' => ['nullable', 'numeric'],
            'is_active' => ['boolean'],
        ];
    }
}
