<?php

namespace Tests\Feature;

use App\Enums\RestaurantRole;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private function member(User $user, Restaurant $restaurant, RestaurantRole $role): void
    {
        $restaurant->memberships()->create(['user_id' => $user->id, 'role' => $role]);
    }

    private function authenticated(User $user): static
    {
        return $this->actingAs($user)->withSession(['auth_session_version' => (int) $user->session_version]);
    }

    public function test_restaurant_creation_assigns_an_owner_and_scopes_list(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $this->authenticated($owner)->postJson('/api/v1/restaurants', ['name' => 'Café Atlas'])
            ->assertCreated()->assertJsonPath('restaurant.name', 'Café Atlas');
        $restaurant = Restaurant::query()->firstOrFail();
        $this->assertDatabaseHas('restaurant_memberships', [
            'restaurant_id' => $restaurant->id, 'user_id' => $owner->id, 'role' => 'owner',
        ]);
        $this->authenticated($other)->getJson('/api/v1/restaurants')->assertOk()->assertJsonCount(0, 'restaurants');
        $this->getJson("/api/v1/restaurants/{$restaurant->id}/")->assertNotFound();
    }

    public function test_all_other_tenant_ids_are_hidden_including_switch_and_member_operations(): void
    {
        $a = Restaurant::factory()->create();
        $b = Restaurant::factory()->create();
        $ownerA = User::factory()->create();
        $ownerB = User::factory()->create();
        $this->member($ownerA, $a, RestaurantRole::Owner);
        $this->member($ownerB, $b, RestaurantRole::Owner);
        $memberB = $b->memberships()->firstOrFail();

        $this->authenticated($ownerA)->getJson("/api/v1/restaurants/{$b->id}/")->assertNotFound();
        $this->patchJson("/api/v1/restaurants/{$b->id}/", ['name' => 'Hacked'])->assertNotFound();
        $this->postJson("/api/v1/restaurants/{$b->id}/switch")->assertNotFound();
        $this->getJson("/api/v1/restaurants/{$b->id}/members")->assertNotFound();
        $this->patchJson("/api/v1/restaurants/{$b->id}/members/{$memberB->id}", ['role' => 'waiter'])->assertNotFound();
        $this->deleteJson("/api/v1/restaurants/{$b->id}/members/{$memberB->id}")->assertNotFound();
        $this->assertSame($ownerB->id, $memberB->fresh()->user_id);
        $this->assertSame('owner', $memberB->fresh()->role->value);
        $this->assertSame($b->name, $b->fresh()->name);
    }

    public function test_member_ids_are_scoped_even_when_actor_is_owner_of_another_restaurant(): void
    {
        $a = Restaurant::factory()->create();
        $b = Restaurant::factory()->create();
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $this->member($owner, $a, RestaurantRole::Owner);
        $this->member($other, $b, RestaurantRole::Owner);
        $memberB = $b->memberships()->firstOrFail();

        $this->authenticated($owner)
            ->patchJson("/api/v1/restaurants/{$a->id}/members/{$memberB->id}", ['role' => 'waiter'])->assertNotFound();
        $this->deleteJson("/api/v1/restaurants/{$a->id}/members/{$memberB->id}")->assertNotFound();
    }

    public function test_roles_enforce_membership_management_and_restaurant_update(): void
    {
        $restaurant = Restaurant::factory()->create();
        $owner = User::factory()->create();
        $manager = User::factory()->create();
        $waiter = User::factory()->create();
        $editor = User::factory()->create();
        $kitchen = User::factory()->create();
        foreach ([
            [$owner, RestaurantRole::Owner],
            [$manager, RestaurantRole::Manager],
            [$waiter, RestaurantRole::Waiter],
            [$editor, RestaurantRole::MenuEditor],
            [$kitchen, RestaurantRole::KitchenStaff],
        ] as [$user, $role]) {
            $this->member($user, $restaurant, $role);
        }

        foreach ([$waiter, $editor, $kitchen] as $user) {
            $this->authenticated($user)->patchJson("/api/v1/restaurants/{$restaurant->id}/", ['name' => 'Forbidden'])
                ->assertForbidden();
            $this->getJson("/api/v1/restaurants/{$restaurant->id}/members")->assertForbidden();
        }
        $this->authenticated($manager)
            ->patchJson("/api/v1/restaurants/{$restaurant->id}/", ['name' => 'Allowed'])->assertOk();
        $this->getJson("/api/v1/restaurants/{$restaurant->id}/members")->assertForbidden();
        $this->authenticated($owner)->getJson("/api/v1/restaurants/{$restaurant->id}/members")
            ->assertOk()->assertJsonCount(5, 'members');
    }

    public function test_owners_cannot_remove_the_last_owner_and_reject_invalid_roles(): void
    {
        $restaurant = Restaurant::factory()->create();
        $owner = User::factory()->create();
        $this->member($owner, $restaurant, RestaurantRole::Owner);
        $member = $restaurant->memberships()->firstOrFail();
        $this->authenticated($owner)
            ->deleteJson("/api/v1/restaurants/{$restaurant->id}/members/{$member->id}")
            ->assertUnprocessable();
        $this->patchJson("/api/v1/restaurants/{$restaurant->id}/members/{$member->id}", ['role' => 'waiter'])
            ->assertUnprocessable();
        $this->patchJson("/api/v1/restaurants/{$restaurant->id}/members/{$member->id}", ['role' => 'super_admin'])
            ->assertUnprocessable();
        $this->assertSame('owner', $member->fresh()->role->value);
    }

    public function test_revoked_membership_invalidates_active_tenant_and_scoped_access(): void
    {
        $restaurant = Restaurant::factory()->create();
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $this->member($owner, $restaurant, RestaurantRole::Owner);
        $this->member($member, $restaurant, RestaurantRole::Waiter);

        $this->authenticated($member)->postJson("/api/v1/restaurants/{$restaurant->id}/switch")->assertOk();
        $this->getJson('/api/v1/restaurants/active')->assertJsonPath('restaurant.id', $restaurant->id);
        $restaurant->memberships()->where('user_id', $member->id)->delete();
        $this->getJson('/api/v1/restaurants/active')->assertJsonPath('restaurant', null);
        $this->getJson("/api/v1/restaurants/{$restaurant->id}/")->assertNotFound();
    }

    public function test_super_admin_role_never_bypasses_restaurant_scoping(): void
    {
        $admin = User::factory()->create(['is_super_admin' => true]);
        $restaurant = Restaurant::factory()->create();
        $this->authenticated($admin)
            ->getJson("/api/v1/restaurants/{$restaurant->id}/")->assertNotFound();
        $this->getJson('/api/v1/platform/restaurants')->assertOk();
        $regular = User::factory()->create();
        $this->authenticated($regular)
            ->getJson('/api/v1/platform/restaurants')->assertForbidden();
    }
}
