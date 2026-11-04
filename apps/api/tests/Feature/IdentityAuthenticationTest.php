<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class IdentityAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_is_verified_by_email_and_uses_a_session(): void
    {
        Notification::fake();
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Amine',
            'email' => 'amine@example.test',
            'password' => 'StrongPassphrase123',
            'password_confirmation' => 'StrongPassphrase123',
        ]);
        $response->assertCreated()->assertJsonPath('user.email_verified', false);
        $user = User::query()->firstOrFail();
        $this->assertTrue(Hash::check('StrongPassphrase123', $user->password));
        Notification::assertSentTo($user, VerifyEmail::class);
        $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('user.id', $user->id);
        $this->getJson('/api/v1/restaurants')->assertForbidden();
    }

    public function test_duplicate_email_and_weak_password_are_rejected(): void
    {
        User::factory()->create(['email' => 'member@example.test']);
        $this->postJson('/api/v1/auth/register', [
            'name' => 'A', 'email' => 'member@example.test',
            'password' => 'weak', 'password_confirmation' => 'weak',
        ])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_login_regenerates_session_and_logout_revokes_access(): void
    {
        $user = User::factory()->create(['password' => 'StrongPassphrase123']);
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'wrong'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'StrongPassphrase123'])
            ->assertOk()->assertJsonPath('user.id', $user->id);
        $this->getJson('/api/v1/auth/me')->assertOk();
        $this->postJson('/api/v1/auth/logout')->assertOk();
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_password_reset_is_generic_for_unknown_accounts_and_invalidates_sessions(): void
    {
        Notification::fake();
        $user = User::factory()->create(['password' => 'StrongPassphrase123']);
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'absent@example.test'])->assertOk();
        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk();
        Notification::assertSentTo($user, ResetPassword::class);
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'StrongPassphrase123'])->assertOk();
        $token = Password::broker()->createToken($user);
        $this->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email, 'token' => $token,
            'password' => 'ChangedPassphrase123', 'password_confirmation' => 'ChangedPassphrase123',
        ])->assertOk();
        $this->assertTrue(Hash::check('ChangedPassphrase123', $user->fresh()->password));
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'StrongPassphrase123'])
            ->assertUnprocessable();
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'ChangedPassphrase123'])
            ->assertOk();
    }

    public function test_invalid_password_reset_token_is_rejected(): void
    {
        $user = User::factory()->create();
        $this->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email, 'token' => 'wrong',
            'password' => 'ChangedPassphrase123', 'password_confirmation' => 'ChangedPassphrase123',
        ])->assertUnprocessable()->assertJsonValidationErrors('token');
    }

    public function test_signed_email_verification_confirms_only_authenticated_matching_user(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();
        $other = User::factory()->unverified()->create();
        $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), [
            'id' => $user->getKey(),
            'hash' => sha1($user->getEmailForVerification()),
        ]);
        $path = parse_url($url, PHP_URL_PATH).'?'.parse_url($url, PHP_URL_QUERY);

        $this->actingAs($other)->withSession(['auth_session_version' => 0])
            ->get($path)->assertForbidden();
        $this->actingAs($user)->withSession(['auth_session_version' => 0])
            ->get($path)->assertRedirect();
        $this->assertTrue($user->fresh()->hasVerifiedEmail());

        $tampered = str_replace('signature=', 'signature=incorrect', $path);
        $this->get($tampered)->assertForbidden();
    }
}
