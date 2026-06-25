<?php

namespace App\Http\Middleware;

use App\Models\PosDevice;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authenticates offline-POS sync requests by the bearer token issued at device
 * enrollment. Revoked devices are rejected with a signal the client uses to wipe.
 */
class AuthenticatePosDevice
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['message' => 'Device token required.'], 401);
        }

        $device = PosDevice::query()
            ->where('token_hash', PosDevice::hashToken($token))
            ->first();

        if (! $device) {
            return response()->json(['message' => 'Unknown device.'], 401);
        }

        if (! $device->isActive()) {
            // The client treats this as "wipe local store and refuse login".
            return response()->json(['message' => 'Device revoked.', 'device_status' => 'revoked'], 403);
        }

        $device->forceFill(['last_seen_at' => now()])->save();
        $request->attributes->set('pos_device', $device);

        return $next($request);
    }
}
