<?php

use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\RestaurantController;
use App\Http\Controllers\Api\V1\RestaurantMemberController;
use App\Http\Controllers\Api\V1\EmailVerificationController;
use App\Http\Controllers\Api\V1\PlatformController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', [HealthController::class, 'live'])->name('api.v1.health');
    Route::get('/ready', [HealthController::class, 'ready'])->name('api.v1.ready');

    Route::middleware('web')->group(function (): void {
        Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
        Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
        Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
        Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

        Route::middleware(['auth:sanctum', 'auth:web'])->group(function (): void {
            Route::get('/auth/me', [AuthController::class, 'me']);
            Route::post('/auth/logout', [AuthController::class, 'logout']);
            Route::post('/auth/email/verification-notification', [EmailVerificationController::class, 'resend'])->middleware('throttle:6,1');
            Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])->middleware(['signed', 'throttle:6,1'])->name('verification.verify');

            Route::middleware('verified')->group(function (): void {
                Route::get('/restaurants', [RestaurantController::class, 'index']);
                Route::post('/restaurants', [RestaurantController::class, 'store']);
                Route::get('/restaurants/active', [RestaurantController::class, 'active']);
                Route::get('/platform/restaurants', [PlatformController::class, 'restaurants']);

                Route::prefix('restaurants/{restaurant}')->middleware('tenant')->group(function (): void {
                    Route::get('/', [RestaurantController::class, 'show']);
                    Route::patch('/', [RestaurantController::class, 'update']);
                    Route::post('/switch', [RestaurantController::class, 'switch']);
                    Route::get('/members', [RestaurantMemberController::class, 'index']);
                    Route::post('/members', [RestaurantMemberController::class, 'store']);
                    Route::patch('/members/{member}', [RestaurantMemberController::class, 'update']);
                    Route::delete('/members/{member}', [RestaurantMemberController::class, 'destroy']);
                });
            });
        });
    });
});
