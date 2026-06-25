<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Employee extends Model
{
    use Auditable, BelongsToCompany;

    protected $fillable = [
        'company_id', 'branch_id', 'name', 'employee_no', 'position',
        'phone', 'email', 'salary_minor', 'joined_on', 'status',
    ];

    protected function casts(): array
    {
        return [
            'salary_minor' => 'integer',
            'joined_on' => 'date',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
