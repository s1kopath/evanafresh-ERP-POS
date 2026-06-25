<?php

namespace App\Http\Controllers;

use App\Http\Requests\SettingsRequest;
use App\Models\AuditLog;
use App\Models\Company;
use App\Models\Setting;
use App\Models\TaxRate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        $company = $request->user()->company;

        return Inertia::render('Settings/Index', [
            'settings' => $this->values($company),
            'company' => [
                'name' => $company->name,
                'currency' => $company->currency,
                'trn' => $company->trn,
            ],
            'taxRates' => TaxRate::orderByDesc('is_default')->orderBy('name')
                ->get(['id', 'name', 'rate', 'is_default', 'is_active']),
        ]);
    }

    public function update(SettingsRequest $request)
    {
        $pairs = [
            'store_header_name' => $request->input('store_header_name'),
            'store_header_address' => $request->input('store_header_address'),
            'store_header_phone' => $request->input('store_header_phone'),
            'vat_number' => $request->input('vat_number'),
            'near_expiry_days' => (string) $request->integer('near_expiry_days'),
            'low_stock_alerts' => $request->boolean('low_stock_alerts') ? '1' : '0',
        ];

        foreach ($pairs as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        AuditLog::record('settings.update', null, ['auditable_type' => 'settings']);

        return back()->with('success', 'Settings saved.');
    }

    /** Stored values merged with sensible defaults derived from the company. */
    private function values(Company $company): array
    {
        $stored = Setting::pluck('value', 'key');

        return [
            'store_header_name' => $stored['store_header_name'] ?? $company->name,
            'store_header_address' => $stored['store_header_address'] ?? '',
            'store_header_phone' => $stored['store_header_phone'] ?? '',
            'vat_number' => $stored['vat_number'] ?? $company->trn,
            'near_expiry_days' => (int) ($stored['near_expiry_days'] ?? 30),
            'low_stock_alerts' => (bool) ($stored['low_stock_alerts'] ?? true),
        ];
    }
}
