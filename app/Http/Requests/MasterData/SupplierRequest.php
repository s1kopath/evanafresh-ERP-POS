<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;

class SupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route is gated by can:masterdata.manage
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:191'],
            'contact_name' => ['nullable', 'string', 'max:191'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:191'],
            'address' => ['nullable', 'string', 'max:255'],
            'trn' => ['nullable', 'string', 'max:32'],
            'opening_balance' => ['nullable', 'numeric'],
            'is_active' => ['boolean'],
        ];
    }
}
