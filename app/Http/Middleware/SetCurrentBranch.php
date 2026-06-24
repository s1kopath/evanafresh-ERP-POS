<?php

namespace App\Http\Middleware;

use App\Support\CurrentBranch;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the active branch for the request and stores it in the CurrentBranch
 * singleton. Non-owners are locked to their assigned branch; owners may focus a
 * branch via session('current_branch_id'), or see all branches when none is set.
 */
class SetCurrentBranch
{
    public function __construct(protected CurrentBranch $currentBranch) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($user = $request->user()) {
            $this->currentBranch->set(
                $user->is_owner
                    ? $request->session()->get('current_branch_id')
                    : $user->branch_id
            );
        }

        return $next($request);
    }
}
