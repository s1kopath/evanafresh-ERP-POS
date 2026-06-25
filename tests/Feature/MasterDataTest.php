<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Company;
use App\Models\Product;
use App\Models\TaxRate;
use App\Models\User;
use Database\Seeders\OrgSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MasterDataTest extends TestCase
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

    // ---- Permission gating -------------------------------------------------

    public function test_masterdata_is_gated_by_permission(): void
    {
        $this->actingAs($this->user('cashier@evanafresh.com'))
            ->get('/master-data/products')->assertForbidden();

        $this->actingAs($this->user('manager@evanafresh.com'))
            ->get('/master-data/products')->assertOk();
    }

    // ---- Products + per-branch overrides + money ---------------------------

    public function test_manager_can_create_a_product_with_branch_overrides(): void
    {
        $manager = $this->user('manager@evanafresh.com');
        $b1 = Branch::where('code', 'B1')->firstOrFail();

        $this->actingAs($manager)->post('/master-data/products', [
            'name' => 'Test Cola 330ml',
            'sku' => 'TC-330',
            'barcode' => '6290000000019',
            'sell_price' => '3.50',
            'cost_price' => '2.00',
            'is_weight_based' => false,
            'reorder_level' => 5,
            'is_active' => true,
            'branches' => [
                ['branch_id' => $b1->id, 'stocked' => true, 'min_stock_level' => 8, 'price' => '3.25'],
            ],
        ])->assertRedirect('/master-data/products');

        // Money is stored as integer minor units (halalas).
        $this->assertDatabaseHas('products', [
            'name' => 'Test Cola 330ml',
            'sell_price_minor' => 350,
            'cost_price_minor' => 200,
        ]);

        $product = Product::where('barcode', '6290000000019')->firstOrFail();
        $this->assertDatabaseHas('product_branch', [
            'product_id' => $product->id,
            'branch_id' => $b1->id,
            'price_minor' => 325,
            'is_active' => true,
        ]);
    }

    public function test_product_image_upload_is_optimized_and_stored(): void
    {
        Storage::fake('public');
        $manager = $this->user('manager@evanafresh.com');

        $this->actingAs($manager)->post('/master-data/products', [
            'name' => 'With Photo',
            'sell_price' => '2.00',
            'image' => UploadedFile::fake()->image('photo.jpg', 1200, 1200),
        ])->assertRedirect('/master-data/products');

        $product = Product::where('name', 'With Photo')->firstOrFail();
        $this->assertNotNull($product->image_path);
        Storage::disk('public')->assertExists($product->image_path);
    }

    public function test_product_image_can_be_removed(): void
    {
        Storage::fake('public');
        $manager = $this->user('manager@evanafresh.com');
        $this->actingAs($manager);

        Storage::disk('public')->put('products/old.webp', 'x');
        $product = Product::create(['name' => 'Has Photo', 'sell_price_minor' => 500, 'image_path' => 'products/old.webp']);

        $this->put("/master-data/products/{$product->id}", [
            'name' => 'Has Photo',
            'sell_price' => '5.00',
            'remove_image' => true,
        ])->assertRedirect('/master-data/products');

        $this->assertNull($product->fresh()->image_path);
        Storage::disk('public')->assertMissing('products/old.webp');
    }

    public function test_product_label_page_renders(): void
    {
        $manager = $this->user('manager@evanafresh.com');
        $this->actingAs($manager);
        $product = Product::create(['name' => 'Labelled Item', 'sell_price_minor' => 500, 'barcode' => '6290000000099']);

        $this->get("/master-data/products/{$product->id}/label")->assertOk();
    }

    public function test_product_create_writes_an_audit_log(): void
    {
        $manager = $this->user('manager@evanafresh.com');

        $this->actingAs($manager)->post('/master-data/products', [
            'name' => 'Audited Product',
            'sell_price' => '1.00',
        ])->assertRedirect();

        $this->assertDatabaseHas('audit_logs', [
            'event' => 'created',
            'auditable_type' => Product::class,
        ]);
    }

    // ---- Tax-rate default toggling -----------------------------------------

    public function test_setting_a_default_tax_rate_unsets_the_others(): void
    {
        $owner = $this->user('owner@evanafresh.com');

        $this->actingAs($owner)->post('/settings/tax-rates', ['name' => 'VAT A', 'rate' => 15, 'is_default' => true]);
        $this->actingAs($owner)->post('/settings/tax-rates', ['name' => 'VAT B', 'rate' => 5, 'is_default' => true]);

        $this->assertSame(1, TaxRate::where('is_default', true)->count());
        $this->assertSame('VAT B', TaxRate::where('is_default', true)->first()->name);
    }

    // ---- Company isolation -------------------------------------------------

    public function test_products_are_isolated_by_company(): void
    {
        $manager = $this->user('manager@evanafresh.com');
        $this->actingAs($manager);
        Product::create(['name' => 'Company One Only', 'sell_price_minor' => 500]);

        // A user of a different company cannot see it through the global scope.
        $other = Company::create(['name' => 'Rival Co', 'currency' => 'SAR']);
        $otherUser = User::create([
            'name' => 'Rival Owner', 'email' => 'rival@example.com', 'password' => 'password',
            'company_id' => $other->id, 'is_owner' => true, 'is_active' => true,
        ]);

        $this->actingAs($otherUser);
        $this->assertFalse(Product::where('name', 'Company One Only')->exists());

        $this->actingAs($manager);
        $this->assertTrue(Product::where('name', 'Company One Only')->exists());
    }

    // ---- CSV import --------------------------------------------------------

    public function test_csv_import_creates_products(): void
    {
        $manager = $this->user('manager@evanafresh.com');
        $csv = "name,barcode,category,sell_price,cost_price\n"
             . "Imported Lentils 1kg,6290000000033,Grocery,7.99,5.10\n";
        $file = UploadedFile::fake()->createWithContent('products.csv', $csv);

        $this->actingAs($manager)->post('/master-data/import/products', ['file' => $file])
            ->assertRedirect('/master-data/import?type=products');

        $this->assertDatabaseHas('products', [
            'barcode' => '6290000000033',
            'name' => 'Imported Lentils 1kg',
            'sell_price_minor' => 799,
        ]);
        // Category auto-created from the CSV.
        $this->assertDatabaseHas('categories', ['name' => 'Grocery']);
    }
}
