<?php

use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', [HealthController::class, 'live'])->name('api.v1.health');
    Route::get('/ready', [HealthController::class, 'ready'])->name('api.v1.ready');
});
