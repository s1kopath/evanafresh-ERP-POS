<?php

namespace App\Providers;

use App\Models\User;
use App\Support\CurrentBranch;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // One resolved branch context per request (consumed by BelongsToBranch).
        $this->app->scoped(CurrentBranch::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Resolve every authorization ability through the RBAC permission set, so
        // `can:masterdata.manage` middleware and $user->can('…') mirror the client
        // `can()` helper. Owners hold everything (handled in hasPermission()).
        Gate::before(fn (User $user, string $ability) => $user->hasPermission($ability) ?: null);
    }
}
