<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\RestaurantRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\RestaurantRequest;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class RestaurantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $restaurants = $request->user()->restaurants()
            ->orderBy('restaurants.id')->get(['restaurants.id', 'restaurants.name', 'restaurants.slug']);

        return response()->json(['restaurants' => $restaurants->map(fn (Restaurant $restaurant) => [
            'id' => $restaurant->id,
            'name' => $restaurant->name,
            'slug' => $restaurant->slug,
            'role' => $restaurant->pivot->role,
        ])]);
    }

    public function store(RestaurantRequest $request): JsonResponse
    {
        $restaurant = DB::transaction(function () use ($request): Restaurant {
            $name = $request->validated('name');
            $restaurant = Restaurant::create([
                'name' => $name,
                'slug' => Str::slug($name).'-'.Str::lower(Str::random(12)),
            ]);
            $restaurant->memberships()->create([
                'user_id' => $request->user()->getKey(),
                'role' => RestaurantRole::Owner,
            ]);

            return $restaurant;
        });

        return response()->json(['restaurant' => $restaurant], 201);
    }

    public function show(Request $request): JsonResponse
    {
        $restaurant = $request->attributes->get('tenant_restaurant');
        Gate::authorize('view', $restaurant);

        return response()->json(['restaurant' => $restaurant, 'role' => $request->attributes->get('tenant_membership')->role->value]);
    }

    public function update(RestaurantRequest $request): JsonResponse
    {
        $restaurant = $request->attributes->get('tenant_restaurant');
        Gate::authorize('update', $restaurant);
        $restaurant->update($request->safe()->only('name'));

        return response()->json(['restaurant' => $restaurant->refresh()]);
    }

    public function switch(Request $request): JsonResponse
    {
        $restaurant = $request->attributes->get('tenant_restaurant');
        Gate::authorize('view', $restaurant);
        $request->session()->put('active_restaurant_id', $restaurant->getKey());

        return response()->json(['restaurant' => $restaurant, 'role' => $request->attributes->get('tenant_membership')->role->value]);
    }

    public function active(Request $request): JsonResponse
    {
        $id = $request->session()->get('active_restaurant_id');
        if ($id === null) {
            return response()->json(['restaurant' => null]);
        }

        $membership = $request->user()->memberships()->with('restaurant')
            ->where('restaurant_id', $id)->first();
        if ($membership === null) {
            $request->session()->forget('active_restaurant_id');

            return response()->json(['restaurant' => null]);
        }

        return response()->json(['restaurant' => $membership->restaurant, 'role' => $membership->role->value]);
    }
}
