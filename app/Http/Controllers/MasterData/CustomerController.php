<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\CustomerRequest;
use App\Models\Branch;
use App\Models\Customer;
use App\Support\Money;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();

        $customers = Customer::query()
            ->with('branch:id,code')
            ->when($search, fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Customer $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'phone' => $c->phone,
                'email' => $c->email,
                'address' => $c->address,
                'branch_id' => $c->branch_id,
                'branch' => $c->branch?->code,
                'credit_limit' => Money::toMajor($c->credit_limit_minor),
                'opening_balance' => Money::toMajor($c->opening_balance_minor),
                'is_active' => $c->is_active,
            ]);

        return Inertia::render('MasterData/Customers', [
            'customers' => $customers,
            'branches' => Branch::where('company_id', $request->user()->company_id)->orderBy('name')->get(['id', 'name', 'code']),
            'filters' => ['search' => $search],
        ]);
    }

    public function store(CustomerRequest $request)
    {
        Customer::create($this->attributes($request));

        return back()->with('success', 'Customer created.');
    }

    public function update(CustomerRequest $request, Customer $customer)
    {
        $customer->update($this->attributes($request));

        return back()->with('success', 'Customer updated.');
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return back()->with('success', 'Customer deleted.');
    }

    private function attributes(CustomerRequest $request): array
    {
        return [
            'name' => $request->string('name'),
            'phone' => $request->input('phone'),
            'email' => $request->input('email'),
            'address' => $request->input('address'),
            'branch_id' => $request->integer('branch_id') ?: null,
            'credit_limit_minor' => Money::toMinor($request->input('credit_limit')),
            'opening_balance_minor' => Money::toMinor($request->input('opening_balance')),
            'is_active' => $request->boolean('is_active', true),
        ];
    }
}
