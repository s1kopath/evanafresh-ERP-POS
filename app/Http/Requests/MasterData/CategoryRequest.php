<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route is gated by can:masterdata.manage
    }

    public function rules(): array
    {
        $companyId = $this->user()->company_id;
        $id = $this->route('category')?->id;

        return [
            'name' => [
                'required', 'string', 'max:191',
                Rule::unique('categories', 'name')->where('company_id', $companyId)->ignore($id),
            ],
            'description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ];
    }
}
