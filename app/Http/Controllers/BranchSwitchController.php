<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BranchSwitchController extends Controller
{
    /**
     * Switch the owner's active branch focus. branch_id = null means "all branches".
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->is_owner, 403, 'Only owners can switch branches.');

        $data = $request->validate([
            'branch_id' => ['nullable', 'integer'],
        ]);

        $branchId = $data['branch_id'] ?? null;

        if ($branchId) {
            $belongs = Branch::query()
                ->where('id', $branchId)
                ->where('company_id', $user->company_id)
                ->exists();
            abort_unless($belongs, 403, 'That branch is not part of your company.');

            $request->session()->put('current_branch_id', $branchId);
        } else {
            $request->session()->forget('current_branch_id');
        }

        AuditLog::record('branch.switch', null, ['new_values' => ['branch_id' => $branchId]]);

        return back(303);
    }
}
