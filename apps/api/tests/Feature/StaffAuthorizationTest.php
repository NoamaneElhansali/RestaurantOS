<?php

namespace Tests\Feature;

use App\Enums\RestaurantRole;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function asUser(User $user): static
    {
        return $this->actingAs($user)->withSession(['auth_session_version' => (int) $user->session_version]);
    }

    public function test_all_roles_have_explicit_allow_lists_without_implicit_privilege_escalation(): void
    {
        $abilities = ['view', 'update', 'manage_members', 'edit_menu', 'serve', 'kitchen'];
        foreach (RestaurantRole::cases() as $role) {
            foreach ($abilities as $ability) {
                $this->assertIsBool($role->can($ability));
            }
            $this->assertFalse($role->can('super_admin'));
        }

        $this->assertTrue(RestaurantRole::Owner->can('manage_members'));
        $this->assertFalse(RestaurantRole::Manager->can('manage_members'));
        $this->assertTrue(RestaurantRole::MenuEditor->can('edit_menu'));
        $this->assertFalse(RestaurantRole::Waiter->can('edit_menu'));
        $this->assertTrue(RestaurantRole::KitchenStaff->can('kitchen'));
        $this->assertFalse(RestaurantRole::KitchenStaff->can('update'));
    }

    public function test_owner_can_add_and_remove_verified_staff_and_cannot_add_invalid_role(): void
    {
        $restaurant = Restaurant::factory()->create();
        $owner = User::factory()->create();
        $employee = User::factory()->create();
        $restaurant->memberships()->create(['user_id' => $owner->id, 'role' => RestaurantRole::Owner]);

        $url = "/api/v1/restaurants/{$restaurant->id}/members";
        $this->asUser($owner)->postJson($url, ['email' => $employee->email, 'role' => 'waiter'])
            ->assertCreated()->assertJsonPath('member.role', 'waiter');
        $this->postJson($url, ['email' => $employee->email, 'role' => 'waiter'])
            ->assertUnprocessable();
        $this->postJson($url, ['email' => $employee->email, 'role' => 'super_admin'])
            ->assertUnprocessable();
        $membership = $restaurant->memberships()->where('user_id', $employee->id)->firstOrFail();
        $this->patchJson("$url/{$membership->id}", ['role' => 'kitchen_staff'])
            ->assertOk()->assertJsonPath('member.role', 'kitchen_staff');
        $this->deleteJson("$url/{$membership->id}")->assertOk();
        $this->assertDatabaseMissing('restaurant_memberships', ['id' => $membership->id]);
    }

    public function test_an_unverified_user_cannot_be_added_as_staff(): void
    {
        $restaurant = Restaurant::factory()->create();
        $owner = User::factory()->create();
        $unverified = User::factory()->unverified()->create();
        $restaurant->memberships()->create(['user_id' => $owner->id, 'role' => RestaurantRole::Owner]);

        $this->asUser($owner)
            ->postJson("/api/v1/restaurants/{$restaurant->id}/members", [
                'email' => $unverified->email, 'role' => 'waiter',
            ])->assertNotFound();

        $this->assertDatabaseMissing('restaurant_memberships', [
            'restaurant_id' => $restaurant->id, 'user_id' => $unverified->id,
        ]);
    }

    public function test_owner_transfer_requires_another_owner_and_previous_owner_loses_privilege(): void
    {
        $restaurant = Restaurant::factory()->create();
        $first = User::factory()->create();
        $second = User::factory()->create();
        $firstMembership = $restaurant->memberships()->create(['user_id' => $first->id, 'role' => RestaurantRole::Owner]);

        $url = "/api/v1/restaurants/{$restaurant->id}/members";
        $this->asUser($first)->patchJson("$url/{$firstMembership->id}", ['role' => 'manager'])
            ->assertUnprocessable();
        $this->postJson($url, ['email' => $second->email, 'role' => 'owner'])->assertCreated();
        $this->patchJson("$url/{$firstMembership->id}", ['role' => 'manager'])->assertOk();
        $this->getJson($url)->assertForbidden();
        $this->asUser($second)->getJson($url)->assertOk()->assertJsonCount(2, 'members');
        $this->assertSame('manager', $firstMembership->fresh()->role->value);
    }

    public function test_only_verified_users_can_create_restaurants_and_cannot_self_promote(): void
    {
        $unverified = User::factory()->unverified()->create();
        $this->asUser($unverified)->postJson('/api/v1/restaurants', ['name' => 'Unauthorized'])
            ->assertForbidden();

        $verified = User::factory()->create();
        $this->asUser($verified)
            ->postJson('/api/v1/restaurants', ['name' => 'Registered Café', 'is_super_admin' => true])
            ->assertCreated();
        $this->assertFalse($verified->fresh()->is_super_admin);
    }
}
