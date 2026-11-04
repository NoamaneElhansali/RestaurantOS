<?php

namespace App\Models;

use App\Enums\RestaurantRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantMembership extends Model
{
    protected $fillable = ['restaurant_id', 'user_id', 'role'];

    protected function casts(): array
    {
        return ['role' => RestaurantRole::class];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
