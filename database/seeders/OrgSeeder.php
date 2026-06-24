<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Company;
use App\Models\Role;
use App\Models\Terminal;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class OrgSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::updateOrCreate(
            ['name' => 'Evana Fresh'],
            ['legal_name' => 'Evana Fresh Trading Est.', 'trn' => '300000000000003', 'currency' => 'SAR'],
        );

        $b1 = Branch::updateOrCreate(
            ['company_id' => $company->id, 'code' => 'B1'],
            ['name' => 'Jeddah — Al Salamah', 'address' => 'Al Salamah, Jeddah', 'phone' => '+966 12 000 0001', 'is_active' => true],
        );
        $b2 = Branch::updateOrCreate(
            ['company_id' => $company->id, 'code' => 'B2'],
            ['name' => 'Jeddah — Al Rawdah', 'address' => 'Al Rawdah, Jeddah', 'phone' => '+966 12 000 0002', 'is_active' => true],
        );

        // POS registers (with offline-safe per-terminal number prefixes).
        Terminal::updateOrCreate(['branch_id' => $b1->id, 'code' => 'T1'], ['name' => 'Register 1', 'number_prefix' => 'B1-T1', 'number_next' => 1, 'is_active' => true]);
        Terminal::updateOrCreate(['branch_id' => $b1->id, 'code' => 'T2'], ['name' => 'Register 2', 'number_prefix' => 'B1-T2', 'number_next' => 1, 'is_active' => true]);
        Terminal::updateOrCreate(['branch_id' => $b2->id, 'code' => 'T1'], ['name' => 'Register 1', 'number_prefix' => 'B2-T1', 'number_next' => 1, 'is_active' => true]);

        $roleId = Role::pluck('id', 'name');

        // email => [name, branch, is_owner, role, pos_pin]
        $users = [
            'owner@evanafresh.com' => ['Aisha Owner', null, true, 'owner', '0000'],
            'manager@evanafresh.com' => ['Omar Manager', $b1->id, false, 'manager', '1111'],
            'accountant@evanafresh.com' => ['Sara Accountant', $b1->id, false, 'accountant', '3333'],
            'cashier@evanafresh.com' => ['Yusuf Cashier', $b1->id, false, 'cashier', '2222'],
            'cashier.b2@evanafresh.com' => ['Layla Cashier', $b2->id, false, 'cashier', '4444'],
        ];

        foreach ($users as $email => [$name, $branchId, $isOwner, $role, $pin]) {
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'company_id' => $company->id,
                    'branch_id' => $branchId,
                    'is_owner' => $isOwner,
                    'is_active' => true,
                    'password' => 'password', // hashed by the model's cast
                ],
            );

            // pos_pin_hash is guarded — set it explicitly (bcrypt, verified locally offline).
            $user->forceFill(['pos_pin_hash' => Hash::make($pin)])->save();

            $user->roles()->sync([$roleId[$role]]);
        }
    }
}
