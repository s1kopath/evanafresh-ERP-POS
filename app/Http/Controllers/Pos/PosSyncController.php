<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use App\Models\PosDevice;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PosSyncController extends Controller
{
    private function device(Request $request): PosDevice
    {
        return $request->attributes->get('pos_device');
    }

    /**
     * Connectivity probe. The client polls this; success triggers a flush + pull.
     */
    public function heartbeat(Request $request): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'server_time' => now()->toIso8601String(),
            'device_status' => $this->device($request)->status,
        ]);
    }

    /**
     * Pull: catalogue + the user roster the device verifies cashier PINs against
     * (offline). The roster carries the bcrypt PIN verifier — never plaintext.
     */
    public function pull(Request $request): JsonResponse
    {
        $branch = $this->device($request)->branch;

        $roster = User::query()
            ->where('company_id', $branch->company_id)
            ->where('is_active', true)
            ->where(fn ($q) => $q->where('branch_id', $branch->id)->orWhere('is_owner', true))
            ->get()
            ->map(fn (User $u) => [
                'user_id' => $u->id,
                'name' => $u->name,
                'role' => $u->roleName(),
                'permissions' => $u->permissionNames(),
                'pos_pin_hash' => $u->pos_pin_hash, // bcrypt — verified locally on the device
                'status' => 'active',
            ])
            ->values();

        return response()->json([
            'cursor' => now()->toIso8601String(),
            'roster' => $roster,
            'catalogue' => [], // products arrive in Phase 2; empty for the sync spike
        ]);
    }

    /**
     * Push: apply queued mutations idempotently. The sale `uuid` is the dedup key,
     * so a re-sent mutation (lost ack) is recorded exactly once.
     */
    public function push(Request $request): JsonResponse
    {
        $device = $this->device($request);

        $data = $request->validate([
            'mutations' => ['present', 'array'],
            'mutations.*.uuid' => ['required', 'uuid'],
            'mutations.*.type' => ['required', 'string'],
            'mutations.*.payload' => ['required', 'array'],
        ]);

        $results = [];

        foreach ($data['mutations'] as $mutation) {
            if ($mutation['type'] !== 'sale') {
                $results[] = ['uuid' => $mutation['uuid'], 'status' => 'rejected', 'error' => 'unknown type'];
                continue;
            }

            $existing = Sale::where('uuid', $mutation['uuid'])->first();
            if ($existing) {
                $results[] = ['uuid' => $mutation['uuid'], 'status' => 'duplicate', 'server_doc_no' => $existing->number];
                continue;
            }

            $sale = $this->applySale($device, $mutation);

            $results[] = ['uuid' => $sale->uuid, 'status' => 'applied', 'server_doc_no' => $sale->number];
        }

        return response()->json(['results' => $results]);
    }

    private function applySale(PosDevice $device, array $mutation): Sale
    {
        $p = $mutation['payload'];

        return DB::transaction(function () use ($device, $mutation, $p) {
            $sale = Sale::create([
                'uuid' => $mutation['uuid'],
                'branch_id' => $device->branch_id,
                'terminal_id' => $device->terminal_id,
                'device_id' => $device->id,
                'cashier_id' => $p['cashier_id'] ?? null,
                'number' => $p['number'] ?? $mutation['uuid'],
                'status' => 'synced',
                'subtotal_minor' => $p['subtotal_minor'] ?? 0,
                'vat_minor' => $p['vat_minor'] ?? 0,
                'total_minor' => $p['total_minor'] ?? 0,
                'sold_at' => $p['sold_at'] ?? now(),
                'synced_at' => now(),
            ]);

            foreach ($p['lines'] ?? [] as $line) {
                $sale->lines()->create([
                    'name' => $line['name'] ?? 'Item',
                    'barcode' => $line['barcode'] ?? null,
                    'qty' => $line['qty'] ?? 1,
                    'unit_price_minor' => $line['unit_price_minor'] ?? 0,
                    'line_total_minor' => $line['line_total_minor'] ?? 0,
                ]);
            }

            foreach ($p['payments'] ?? [] as $payment) {
                $sale->payments()->create([
                    'method' => $payment['method'] ?? 'cash',
                    'amount_minor' => $payment['amount_minor'] ?? 0,
                    'reference' => $payment['reference'] ?? null,
                ]);
            }

            return $sale;
        });
    }
}
