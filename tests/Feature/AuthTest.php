<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\User;
use Database\Seeders\OrgSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        $this->seed(OrgSeeder::class);
    }

    private function user(string $email): User
    {
        return User::where('email', $email)->firstOrFail();
    }

    // ---- Authentication ----------------------------------------------------

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/')->assertRedirect('/login');
    }

    public function test_login_screen_renders_for_guest(): void
    {
        $this->get('/login')->assertOk();
    }

    public function test_user_can_login_with_correct_credentials(): void
    {
        $this->post('/login', ['email' => 'owner@evanafresh.com', 'password' => 'password'])
            ->assertRedirect('/');

        $this->assertAuthenticated();
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $this->post('/login', ['email' => 'owner@evanafresh.com', 'password' => 'nope'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_inactive_user_cannot_login(): void
    {
        User::where('email', 'cashier@evanafresh.com')->update(['is_active' => false]);

        $this->post('/login', ['email' => 'cashier@evanafresh.com', 'password' => 'password'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_authenticated_user_can_view_dashboard(): void
    {
        $this->actingAs($this->user('owner@evanafresh.com'))->get('/')->assertOk();
    }

    public function test_user_can_logout(): void
    {
        $this->actingAs($this->user('owner@evanafresh.com'))
            ->post('/logout')
            ->assertRedirect('/login');

        $this->assertGuest();
    }

    public function test_login_writes_an_audit_log(): void
    {
        $this->post('/login', ['email' => 'owner@evanafresh.com', 'password' => 'password']);

        $this->assertDatabaseHas('audit_logs', ['event' => 'login']);
    }

    // ---- RBAC --------------------------------------------------------------

    public function test_cashier_permissions_are_limited(): void
    {
        $cashier = $this->user('cashier@evanafresh.com');

        $this->assertTrue($cashier->hasPermission('pos.sell'));
        $this->assertFalse($cashier->hasPermission('accounting.view'));
    }

    public function test_owner_holds_every_permission(): void
    {
        $owner = $this->user('owner@evanafresh.com');

        $this->assertTrue($owner->hasPermission('accounting.view'));
        $this->assertTrue($owner->hasPermission('settings.manage'));
    }

    // ---- Branch scoping ----------------------------------------------------

    public function test_owner_can_switch_branch(): void
    {
        $owner = $this->user('owner@evanafresh.com');
        $b2 = Branch::where('code', 'B2')->firstOrFail();

        $this->actingAs($owner)
            ->post('/branch/switch', ['branch_id' => $b2->id])
            ->assertRedirect();

        $this->assertEquals($b2->id, session('current_branch_id'));
    }

    public function test_non_owner_cannot_switch_branch(): void
    {
        $cashier = $this->user('cashier@evanafresh.com');

        $this->actingAs($cashier)
            ->post('/branch/switch', ['branch_id' => 1])
            ->assertForbidden();
    }

    // ---- Offline POS auth foundation --------------------------------------

    public function test_pos_pin_is_verifiable_for_offline_login(): void
    {
        $cashier = $this->user('cashier@evanafresh.com');

        $this->assertTrue(Hash::check('2222', $cashier->pos_pin_hash));
        $this->assertFalse(Hash::check('0000', $cashier->pos_pin_hash));
    }
}
