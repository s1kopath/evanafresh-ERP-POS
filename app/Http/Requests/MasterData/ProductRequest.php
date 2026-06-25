<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route is gated by can:masterdata.manage
    }

    public function rules(): array
    {
        $companyId = $this->user()->company_id;
        $id = $this->route('product')?->id;
        $inCompany = fn (string $table) => Rule::exists($table, 'id')->where('company_id', $companyId);

        return [
            'name' => ['required', 'string', 'max:191'],
            'sku' => [
                'nullable', 'string', 'max:64',
                Rule::unique('products', 'sku')->where('company_id', $companyId)->ignore($id),
            ],
            'barcode' => [
                'nullable', 'string', 'max:64',
                Rule::unique('products', 'barcode')->where('company_id', $companyId)->ignore($id),
            ],
            'category_id' => ['nullable', 'integer', $inCompany('categories')],
            'unit_id' => ['nullable', 'integer', $inCompany('units')],
            'tax_rate_id' => ['nullable', 'integer', $inCompany('tax_rates')],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'sell_price' => ['required', 'numeric', 'min:0'],
            'is_weight_based' => ['boolean'],
            'reorder_level' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],

            // Photo: optional upload, optimized server-side. remove_image clears it.
            'image' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp,gif', 'max:5120'],
            'remove_image' => ['boolean'],

            // Per-branch overrides — one row per company branch the form rendered.
            'branches' => ['array'],
            'branches.*.branch_id' => ['required', 'integer', Rule::exists('branches', 'id')->where('company_id', $companyId)],
            'branches.*.stocked' => ['boolean'],
            'branches.*.min_stock_level' => ['nullable', 'numeric', 'min:0'],
            'branches.*.price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
