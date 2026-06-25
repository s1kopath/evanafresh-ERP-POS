<?php

namespace App\Http\Requests\MasterData;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route is gated by can:masterdata.manage
    }

    public function rules(): array
    {
        $companyId = $this->user()->company_id;
        $id = $this->route('employee')?->id;

        return [
            'name' => ['required', 'string', 'max:191'],
            'employee_no' => [
                'nullable', 'string', 'max:32',
                Rule::unique('employees', 'employee_no')->where('company_id', $companyId)->ignore($id),
            ],
            'position' => ['nullable', 'string', 'max:191'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:191'],
            'branch_id' => ['nullable', 'integer', Rule::exists('branches', 'id')->where('company_id', $companyId)],
            'salary' => ['nullable', 'numeric', 'min:0'],
            'joined_on' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['active', 'on_leave', 'terminated'])],
        ];
    }
}
