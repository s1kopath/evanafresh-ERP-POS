<?php

namespace App\Providers;

use App\Support\CurrentBranch;
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
        //
    }
}
