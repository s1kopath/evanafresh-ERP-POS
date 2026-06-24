<?php

namespace App\Models\Concerns;

use App\Support\CurrentBranch;
use Illuminate\Database\Eloquent\Builder;

/**
 * Branch isolation. Any model that `use`s this trait is automatically:
 *   - stamped with the current branch_id on create, and
 *   - filtered to the current branch on every query.
 *
 * Owners with no branch selected (CurrentBranch::id() === null) bypass the filter
 * and see every branch.
 */
trait BelongsToBranch
{
    public static function bootBelongsToBranch(): void
    {
        static::creating(function ($model) {
            if (empty($model->branch_id)) {
                if ($id = app(CurrentBranch::class)->id()) {
                    $model->branch_id = $id;
                }
            }
        });

        static::addGlobalScope('branch', function (Builder $builder) {
            $user = auth()->user();
            if (! $user) {
                return;
            }

            $id = app(CurrentBranch::class)->id();
            if (! $user->is_owner) {
                $id = $id ?? $user->branch_id;
            }

            if ($id) {
                $builder->where($builder->getModel()->getTable() . '.branch_id', $id);
            }
        });
    }
}
