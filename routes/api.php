<?php

use App\Http\Controllers\Pos\PosDeviceController;
use App\Http\Controllers\Pos\PosSyncController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Offline POS sync (Phase 4b)
|--------------------------------------------------------------------------
| The contract the Electron POS terminal syncs against. Enrollment is gated by
| an owner/manager's credentials; every other call authenticates by the
| device's bearer token (pos.device middleware). See docs/OFFLINE-POS.md.
*/

Route::prefix('pos')->group(function () {
    // Online, once — issues the device token.
    Route::post('/devices/enroll', [PosDeviceController::class, 'enroll']);

    // Device-token authenticated sync surface.
    Route::middleware('pos.device')->group(function () {
        Route::get('/heartbeat', [PosSyncController::class, 'heartbeat']);
        Route::get('/sync/pull', [PosSyncController::class, 'pull']);
        Route::post('/sync/push', [PosSyncController::class, 'push']);
    });
});
