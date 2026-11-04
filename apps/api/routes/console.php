<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('restaurantos:about', function (): void {
    $this->info('RestaurantOS API foundation');
});
