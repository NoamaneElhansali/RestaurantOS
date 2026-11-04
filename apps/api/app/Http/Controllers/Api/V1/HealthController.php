<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function live(): JsonResponse
    {
        return response()->json([
            'service' => 'restaurantos-api',
            'status' => 'ok',
            'version' => 'v1',
        ])->header('Cache-Control', 'no-store');
    }

    public function ready(): JsonResponse
    {
        try {
            DB::select('SELECT 1');
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'service' => 'restaurantos-api',
                'status' => 'unavailable',
            ], 503)->header('Cache-Control', 'no-store');
        }

        return response()->json([
            'service' => 'restaurantos-api',
            'status' => 'ready',
        ])->header('Cache-Control', 'no-store');
    }
}
