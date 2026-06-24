<?php

namespace App\Support;

/**
 * Holds the active branch for the current request. Resolved once per request by
 * the SetCurrentBranch middleware and consumed by the BelongsToBranch global scope.
 *
 * id() === null means "all branches" (owner viewing the whole company).
 */
class CurrentBranch
{
    protected ?int $branchId = null;

    public function set(int|string|null $id): void
    {
        $this->branchId = $id ? (int) $id : null;
    }

    public function id(): ?int
    {
        return $this->branchId;
    }

    public function isAll(): bool
    {
        return $this->branchId === null;
    }
}
