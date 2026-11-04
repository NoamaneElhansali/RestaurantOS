<?php

namespace Database\Factories;

use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RestaurantFactory extends Factory
{
    protected $model = Restaurant::class;

    public function definition(): array
    {
        $name = fake()->company();

        return ['name' => $name, 'slug' => Str::slug($name).'-'.Str::lower(Str::random(8))];
    }
}
