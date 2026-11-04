<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveRestaurantTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $id = $request->route('restaurant');
        abort_unless(is_string($id) && ctype_digit($id), 404);

        $membership = $request->user()->memberships()
            ->with('restaurant')
            ->where('restaurant_id', $id)->firstOrFail();

        $request->attributes->set('tenant_restaurant', $membership->restaurant);
        $request->attributes->set('tenant_membership', $membership);

        return $next($request);
    }
}
