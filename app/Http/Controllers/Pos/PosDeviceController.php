<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\PosDevice;
use App\Models\Terminal;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PosDeviceController extends Controller
{
    /**
     * Enroll a device (online, once). A manager/owner authenticates with their
     * credentials; the server binds the device to a branch/terminal and issues a
     * bearer token used for all later sync calls.
     */
    public function enroll(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_uid' => ['required', 'string', 'max:191'],
            'device_name' => ['nullable', 'string', 'max:191'],
            'terminal_id' => ['nullable', 'integer'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password) || ! $user->is_active) {
            throw ValidationException::withMessages(['email' => 'Invalid credentials.']);
        }

        if (! ($user->is_owner || $user->hasRole('manager'))) {
            throw ValidationException::withMessages(['email' => 'Only an owner or manager can enroll a device.']);
        }

        // Resolve the branch/terminal this device belongs to.
        $terminal = null;
        if (! empty($data['terminal_id'])) {
            $terminal = Terminal::find($data['terminal_id']);
            if (! $terminal) {
                throw ValidationException::withMessages(['terminal_id' => 'Unknown terminal.']);
            }
        }

        $branchId = $terminal?->branch_id ?? $user->branch_id;
        if (! $branchId) {
            throw ValidationException::withMessages(['terminal_id' => 'A terminal (or a branch-assigned user) is required to enroll.']);
        }

        // Owners can enroll anywhere in their company; managers only in their own branch.
        if (! $user->is_owner && (int) $branchId !== (int) $user->branch_id) {
            throw ValidationException::withMessages(['terminal_id' => 'You can only enroll devices in your own branch.']);
        }

        $token = Str::random(48);

        $device = PosDevice::updateOrCreate(
            ['device_uid' => $data['device_uid']],
            [
                'branch_id' => $branchId,
                'terminal_id' => $terminal?->id,
                'name' => $data['device_name'] ?? 'POS Device',
                'token_hash' => PosDevice::hashToken($token),
                'status' => 'active',
                'enrolled_by' => $user->id,
                'enrolled_at' => now(),
            ],
        );

        AuditLog::record('device.enroll', $device, ['new_values' => ['device_uid' => $device->device_uid]]);

        $device->load('branch', 'terminal');

        return response()->json([
            'device_id' => $device->id,
            'device_token' => $token, // shown once; client stores it in the OS keychain
            'status' => 'active',
            'branch' => [
                'id' => $device->branch->id,
                'name' => $device->branch->name,
                'code' => $device->branch->code,
            ],
            'terminal' => $device->terminal ? [
                'id' => $device->terminal->id,
                'name' => $device->terminal->name,
                'code' => $device->terminal->code,
                'number_prefix' => $device->terminal->number_prefix,
            ] : null,
        ], 201);
    }
}
