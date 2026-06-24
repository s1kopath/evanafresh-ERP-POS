<?php

namespace App\Models\Concerns;

use App\Models\AuditLog;

/**
 * Append an audit_logs row on every create/update/delete of the model.
 * Apply to business models (products, sales, ledgers, …) as they are built.
 */
trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(fn ($model) => AuditLog::record('created', $model, [
            'new_values' => $model->getAttributes(),
        ]));

        static::updated(fn ($model) => AuditLog::record('updated', $model, [
            'old_values' => $model->getOriginal(),
            'new_values' => $model->getChanges(),
        ]));

        static::deleted(fn ($model) => AuditLog::record('deleted', $model, [
            'old_values' => $model->getOriginal(),
        ]));
    }
}
