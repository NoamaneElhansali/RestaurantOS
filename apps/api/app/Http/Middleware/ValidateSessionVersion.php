<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ValidateSessionVersion
{
    public function handle(Request $request, Closure $next): Response
    {
        // Even a still-valid Laravel session cannot outlive a password reset.
        if ($request->session()->get('auth_session_version') !== (int) $request->user()->fresh()->session_version) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            abort(401, 'Session expired.');
        }

        return $next($request);
    }
}
