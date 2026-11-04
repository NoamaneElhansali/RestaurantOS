<?php

namespace App\Policies;

use App\Models\Restaurant;
use App\Models\User;

class RestaurantPolicy
{
    private function memberMay(User $user, Restaurant $restaurant, string $ability): bool
    {
        $membership = $user->memberships()
            ->where('restaurant_id', $restaurant->getKey())->first();

        return $membership !== null && $membership->role->can($ability);
    }

    public function view(User $user, Restaurant $restaurant): bool
    {
        return $this->memberMay($user, $restaurant, 'view');
    }

    public function update(User $user, Restaurant $restaurant): bool
    {
        return $this->memberMay($user, $restaurant, 'update');
    }

    public function manageMembers(User $user, Restaurant $restaurant): bool
    {
        return $this->memberMay($user, $restaurant, 'manage_members');
    }
}
