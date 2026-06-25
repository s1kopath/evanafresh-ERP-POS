<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Company isolation for shared master data (catalogue + parties). Any model that
 * `use`s this trait is automatically:
 *   - stamped with the authenticated user's company_id on create, and
 *   - filtered to that company on every query.
 *
 * Master data (products, categories, units, tax rates, customers, suppliers,
 * employees) is company-wide and shared across branches; per-branch differences
 * (min stock levels, price overrides) live in a separate pivot. Branch isolation
 * is handled by BelongsToBranch on transactional models, not here.
 */
trait BelongsToCompany
{
    public static function bootBelongsToCompany(): void
    {
        static::creating(function ($model) {
            if (empty($model->company_id) && ($user = auth()->user())) {
                $model->company_id = $user->company_id;
            }
        });

        static::addGlobalScope('company', function (Builder $builder) {
            if ($user = auth()->user()) {
                $builder->where($builder->getModel()->getTable() . '.company_id', $user->company_id);
            }
        });
    }
}
