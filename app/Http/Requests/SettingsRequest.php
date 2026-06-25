<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route is gated by can:settings.manage
    }

    public function rules(): array
    {
        return [
            'store_header_name' => ['required', 'string', 'max:191'],
            'store_header_address' => ['nullable', 'string', 'max:255'],
            'store_header_phone' => ['nullable', 'string', 'max:64'],
            'vat_number' => ['nullable', 'string', 'max:32'],
            'near_expiry_days' => ['required', 'integer', 'min:1', 'max:365'],
            'low_stock_alerts' => ['boolean'],
        ];
    }
}
