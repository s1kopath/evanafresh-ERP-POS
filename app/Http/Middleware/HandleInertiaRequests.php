<?php

namespace App\Http\Middleware;

use App\Models\Branch;
use App\Support\CurrentBranch;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        if ($user) {
            $user->loadMissing('roles.permissions', 'branch');
        }

        return [
            ...parent::share($request),
            'app' => [
                'name' => config('app.name'),
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_owner' => $user->is_owner,
                    'role' => $user->roleName(),
                    'permissions' => $user->permissionNames(),
                    'branch' => $user->branch ? [
                        'id' => $user->branch->id,
                        'name' => $user->branch->name,
                        'code' => $user->branch->code,
                    ] : null,
                ] : null,
            ],
            // Branches the user may focus: all company branches for owners, own branch otherwise.
            'branches' => function () use ($user) {
                if (! $user) {
                    return [];
                }
                if ($user->is_owner) {
                    return Branch::query()
                        ->where('company_id', $user->company_id)
                        ->where('is_active', true)
                        ->orderBy('name')
                        ->get(['id', 'name', 'code'])
                        ->all();
                }

                return $user->branch ? [[
                    'id' => $user->branch->id,
                    'name' => $user->branch->name,
                    'code' => $user->branch->code,
                ]] : [];
            },
            'currentBranch' => fn () => app(CurrentBranch::class)->id(),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
