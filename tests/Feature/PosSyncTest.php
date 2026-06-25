<?php

namespace Tests\Feature;

use App\Models\PosDevice;
use App\Models\Sale;
use App\Models\Terminal;
use App\Models\User;
use Database\Seeders\OrgSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class PosSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
        $this->seed(OrgSeeder::class);
    }

    private function b1Terminal(): Terminal
    {
        return Terminal::where('code', 'T1')
            ->whereHas('branch', fn ($q) => $q->where('code', 'B1'))
            ->firstOrFail();
    }

    /** Enroll a device as the B1 manager and return [token, payload]. */
    private function enroll(array $overrides = []): array
    {
        $res = $this->postJson('/api/pos/devices/enroll', array_merge([
            'email' => 'manager@evanafresh.com',
            'password' => 'password',
            'device_uid' => 'dev-test-1',
            'device_name' => 'Till 1',
            'terminal_id' => $this->b1Terminal()->id,
        ], $overrides));

        return [$res->json('device_token'), $res];
    }

    private function authed(string $token): self
    {
        return $this->withHeaders(['Authorization' => 'Bearer ' . $token]);
    }

    private function salePayload(?int $cashierId, string $uuid, string $number = 'B1-T1-000001'): array
    {
        return [
            'mutations' => [[
                'uuid' => $uuid,
                'type' => 'sale',
                'payload' => [
                    'number' => $number,
                    'cashier_id' => $cashierId,
                    'subtotal_minor' => 1000,
                    'vat_minor' => 150,
                    'total_minor' => 1150,
                    'sold_at' => now()->toIso8601String(),
                    'lines' => [
                        ['name' => 'Bananas 1kg', 'qty' => 1, 'unit_price_minor' => 1000, 'line_total_minor' => 1000],
                    ],
                    'payments' => [
                        ['method' => 'cash', 'amount_minor' => 1150],
                    ],
                ],
            ]],
        ];
    }

    // ---- Enrollment --------------------------------------------------------

    public function test_manager_can_enroll_a_device(): void
    {
        [$token, $res] = $this->enroll();

        $res->assertCreated()
            ->assertJsonPath('status', 'active')
            ->assertJsonPath('branch.code', 'B1')
            ->assertJsonPath('terminal.number_prefix', 'B1-T1');

        $this->assertNotEmpty($token);
        $this->assertDatabaseHas('pos_devices', ['device_uid' => 'dev-test-1', 'status' => 'active']);
    }

    public function test_enroll_fails_with_bad_credentials(): void
    {
        $this->postJson('/api/pos/devices/enroll', [
            'email' => 'manager@evanafresh.com',
            'password' => 'wrong',
            'device_uid' => 'dev-x',
            'terminal_id' => $this->b1Terminal()->id,
        ])->assertStatus(422);
    }

    public function test_cashier_cannot_enroll_a_device(): void
    {
        $this->postJson('/api/pos/devices/enroll', [
            'email' => 'cashier@evanafresh.com',
            'password' => 'password',
            'device_uid' => 'dev-x',
            'terminal_id' => $this->b1Terminal()->id,
        ])->assertStatus(422);
    }

    // ---- Token auth --------------------------------------------------------

    public function test_sync_requires_a_device_token(): void
    {
        $this->getJson('/api/pos/heartbeat')->assertStatus(401);
        $this->authed('garbage')->getJson('/api/pos/heartbeat')->assertStatus(401);
    }

    public function test_heartbeat_succeeds_with_token(): void
    {
        [$token] = $this->enroll();

        $this->authed($token)->getJson('/api/pos/heartbeat')
            ->assertOk()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('device_status', 'active');
    }

    public function test_revoked_device_is_rejected(): void
    {
        [$token] = $this->enroll();
        PosDevice::where('device_uid', 'dev-test-1')->update(['status' => 'revoked']);

        $this->authed($token)->getJson('/api/pos/heartbeat')
            ->assertStatus(403)
            ->assertJsonPath('device_status', 'revoked');
    }

    // ---- Pull (roster + offline PIN) --------------------------------------

    public function test_pull_returns_roster_with_pin_verifier(): void
    {
        [$token] = $this->enroll();

        $res = $this->authed($token)->getJson('/api/pos/sync/pull')->assertOk();

        $res->assertJsonPath('catalogue', []);

        $roster = collect($res->json('roster'));
        $cashier = $roster->firstWhere('role', 'cashier');

        $this->assertNotNull($cashier, 'cashier should be in the B1 roster');
        $this->assertArrayHasKey('pos_pin_hash', $cashier);

        // The whole point of offline auth: the synced verifier authenticates the PIN locally.
        $this->assertTrue(Hash::check('2222', $cashier['pos_pin_hash']));
        $this->assertContains('pos.sell', $cashier['permissions']);
    }

    // ---- Push (idempotency) -----------------------------------------------

    public function test_push_records_a_sale(): void
    {
        [$token] = $this->enroll();
        $cashier = User::where('email', 'cashier@evanafresh.com')->firstOrFail();
        $uuid = (string) Str::uuid();

        $this->authed($token)
            ->postJson('/api/pos/sync/push', $this->salePayload($cashier->id, $uuid))
            ->assertOk()
            ->assertJsonPath('results.0.status', 'applied')
            ->assertJsonPath('results.0.server_doc_no', 'B1-T1-000001');

        $sale = Sale::where('uuid', $uuid)->firstOrFail();
        $this->assertSame(1150, $sale->total_minor);
        $this->assertEquals($this->b1Terminal()->branch_id, $sale->branch_id);
        $this->assertCount(1, $sale->lines);
        $this->assertCount(1, $sale->payments);
    }

    public function test_push_is_idempotent_on_resend(): void
    {
        [$token] = $this->enroll();
        $cashier = User::where('email', 'cashier@evanafresh.com')->firstOrFail();
        $uuid = (string) Str::uuid();
        $payload = $this->salePayload($cashier->id, $uuid);

        $this->authed($token)->postJson('/api/pos/sync/push', $payload)
            ->assertJsonPath('results.0.status', 'applied');

        // Re-send the same mutation (simulating a lost ack).
        $this->authed($token)->postJson('/api/pos/sync/push', $payload)
            ->assertJsonPath('results.0.status', 'duplicate');

        $this->assertSame(1, Sale::where('uuid', $uuid)->count());
        $this->assertSame(1, Sale::count());
    }
}
