<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\RestaurantRole;
use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\RestaurantMembership;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RestaurantMemberController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $restaurant = $this->tenant($request);
        Gate::authorize('manageMembers', $restaurant);

        return response()->json(['members' => $restaurant->memberships()
            ->with('user:id,name,email')
            ->orderBy('id')->get()
            ->map(fn (RestaurantMembership $member) => $this->formatMember($member))]);
    }

    public function store(Request $request): JsonResponse
    {
        $restaurant = $this->tenant($request);
        Gate::authorize('manageMembers', $restaurant);

        $data = $request->validate([
            'email' => ['required', 'email:rfc', 'exists:users,email'],
            'role' => ['required', Rule::enum(RestaurantRole::class)],
        ]);
        $user = User::query()->where('email', $data['email'])->firstOrFail();

        $member = $restaurant->memberships()->firstOrCreate(
            ['user_id' => $user->getKey()],
            ['role' => $data['role']],
        );
        if ($member->wasRecentlyCreated === false) {
            throw ValidationException::withMessages(['email' => ['Already a member.']]);
        }

        return response()->json(['member' => $this->formatMember($member->load('user'))], 201);
    }

    public function update(Request $request, string $restaurant, string $member): JsonResponse
    {
        $tenant = $this->tenant($request);
        Gate::authorize('manageMembers', $tenant);

        $data = $request->validate(['role' => ['required', Rule::enum(RestaurantRole::class)]]);
        $updated = DB::transaction(function () use ($tenant, $member, $data): RestaurantMembership {
            Restaurant::query()->whereKey($tenant->getKey())->lockForUpdate()->firstOrFail();
            $membership = $tenant->memberships()->whereKey($member)->firstOrFail();
            $newRole = RestaurantRole::from($data['role']);
            if ($membership->role === RestaurantRole::Owner && $newRole !== RestaurantRole::Owner) {
                $this->assertAnotherOwner($tenant, $membership);
            }
            $membership->update(['role' => $newRole]);

            return $membership->load('user');
        });

        return response()->json(['member' => $this->formatMember($updated)]);
    }

    public function destroy(Request $request, string $restaurant, string $member): JsonResponse
    {
        $tenant = $this->tenant($request);
        Gate::authorize('manageMembers', $tenant);

        DB::transaction(function () use ($tenant, $member): void {
            Restaurant::query()->whereKey($tenant->getKey())->lockForUpdate()->firstOrFail();
            $membership = $tenant->memberships()->whereKey($member)->firstOrFail();
            if ($membership->role === RestaurantRole::Owner) {
                $this->assertAnotherOwner($tenant, $membership);
            }
            $membership->delete();
        });

        return response()->json(['message' => 'Member removed.']);
    }

    private function assertAnotherOwner(Restaurant $restaurant, RestaurantMembership $member): void
    {
        if (! $restaurant->memberships()->where('role', RestaurantRole::Owner->value)
            ->whereKeyNot($member->getKey())->exists()) {
            throw ValidationException::withMessages(['role' => ['The restaurant must retain an owner.']]);
        }
    }

    private function tenant(Request $request): Restaurant
    {
        return $request->attributes->get('tenant_restaurant');
    }

    private function formatMember(RestaurantMembership $member): array
    {
        return [
            'id' => $member->getKey(),
            'user' => $member->user->only('id', 'name', 'email'),
            'role' => $member->role->value,
        ];
    }
}
