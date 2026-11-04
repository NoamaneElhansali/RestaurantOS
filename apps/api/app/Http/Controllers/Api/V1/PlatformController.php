<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformController extends Controller
{
    public function restaurants(Request $request): JsonResponse
    {
        abort_unless($request->user()->is_super_admin, 403);

        return response()->json(['restaurants' => Restaurant::query()->orderBy('id')->paginate(25)]);
    }
}
