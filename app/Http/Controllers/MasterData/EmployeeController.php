<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\EmployeeRequest;
use App\Models\Branch;
use App\Models\Employee;
use App\Support\Money;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();

        $employees = Employee::query()
            ->with('branch:id,code')
            ->when($search, fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%{$search}%")
                ->orWhere('employee_no', 'like', "%{$search}%")
                ->orWhere('position', 'like', "%{$search}%")))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Employee $e) => [
                'id' => $e->id,
                'name' => $e->name,
                'employee_no' => $e->employee_no,
                'position' => $e->position,
                'phone' => $e->phone,
                'email' => $e->email,
                'branch_id' => $e->branch_id,
                'branch' => $e->branch?->code,
                'salary' => Money::toMajor($e->salary_minor),
                'joined_on' => $e->joined_on?->toDateString(),
                'status' => $e->status,
            ]);

        return Inertia::render('MasterData/Employees', [
            'employees' => $employees,
            'branches' => Branch::where('company_id', $request->user()->company_id)->orderBy('name')->get(['id', 'name', 'code']),
            'filters' => ['search' => $search],
        ]);
    }

    public function store(EmployeeRequest $request)
    {
        Employee::create($this->attributes($request));

        return back()->with('success', 'Employee created.');
    }

    public function update(EmployeeRequest $request, Employee $employee)
    {
        $employee->update($this->attributes($request));

        return back()->with('success', 'Employee updated.');
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();

        return back()->with('success', 'Employee deleted.');
    }

    private function attributes(EmployeeRequest $request): array
    {
        return [
            'name' => $request->string('name'),
            'employee_no' => $request->input('employee_no'),
            'position' => $request->input('position'),
            'phone' => $request->input('phone'),
            'email' => $request->input('email'),
            'branch_id' => $request->integer('branch_id') ?: null,
            'salary_minor' => Money::toMinor($request->input('salary')),
            'joined_on' => $request->input('joined_on') ?: null,
            'status' => $request->string('status'),
        ];
    }
}
