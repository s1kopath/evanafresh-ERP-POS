<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // group => [name => label]
        $permissions = [
            'POS' => [
                'pos.sell' => 'Sell at POS',
                'pos.return' => 'Process returns & refunds',
                'pos.close' => 'End-of-day cash closing',
            ],
            'Inventory' => [
                'inventory.view' => 'View inventory',
                'inventory.adjust' => 'Stock adjustments',
                'inventory.transfer' => 'Inter-branch transfers',
            ],
            'Expiry' => [
                'expiry.view' => 'Expiry management',
            ],
            'Purchasing' => [
                'purchasing.view' => 'View purchasing',
                'purchasing.manage' => 'Create POs / GRNs / bills',
                'reorder.view' => 'Reorder planning',
            ],
            'Ledgers' => [
                'ledgers.view' => 'View customer & supplier ledgers',
                'ledgers.collect' => 'Record dues / payments',
            ],
            'Accounting' => [
                'accounting.view' => 'View accounting',
                'accounting.manage' => 'Manage accounting & finance',
                'payroll.manage' => 'Manage payroll & employees',
            ],
            'Reports' => [
                'reports.view' => 'View reports & analytics',
            ],
            'Master Data' => [
                'masterdata.manage' => 'Manage products, categories & parties',
            ],
            'Administration' => [
                'branches.manage' => 'Manage branches & transfers',
                'settings.manage' => 'Manage settings & POS devices',
                'users.manage' => 'Manage users & roles',
            ],
        ];

        $permId = [];
        foreach ($permissions as $group => $perms) {
            foreach ($perms as $name => $label) {
                $permId[$name] = Permission::updateOrCreate(
                    ['name' => $name],
                    ['group' => $group, 'label' => $label],
                )->id;
            }
        }

        // name => [label, description]
        $roles = [
            'owner' => ['Owner', 'Full access across all branches and modules'],
            'manager' => ['Branch Manager', 'Runs a branch — sales, stock, purchasing, dues'],
            'accountant' => ['Accountant', 'Finance, ledgers, payroll and reports'],
            'cashier' => ['Cashier', 'POS selling and returns'],
        ];

        // role => permission names ('*' = everything)
        $matrix = [
            'owner' => '*',
            'manager' => [
                'pos.sell', 'pos.return', 'pos.close',
                'inventory.view', 'inventory.adjust', 'inventory.transfer',
                'expiry.view',
                'purchasing.view', 'purchasing.manage', 'reorder.view',
                'ledgers.view', 'ledgers.collect',
                'reports.view',
                'masterdata.manage',
            ],
            'accountant' => [
                'accounting.view', 'accounting.manage', 'payroll.manage',
                'ledgers.view', 'ledgers.collect',
                'purchasing.view',
                'reports.view',
            ],
            'cashier' => [
                'pos.sell', 'pos.return',
            ],
        ];

        foreach ($roles as $name => [$label, $description]) {
            $role = Role::updateOrCreate(['name' => $name], [
                'label' => $label,
                'description' => $description,
            ]);

            $ids = $matrix[$name] === '*'
                ? array_values($permId)
                : array_map(fn ($n) => $permId[$n], $matrix[$name]);

            $role->permissions()->sync($ids);
        }
    }
}
