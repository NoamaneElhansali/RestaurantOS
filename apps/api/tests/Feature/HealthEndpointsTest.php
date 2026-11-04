<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

class HealthEndpointsTest extends TestCase
{
    public function test_liveness_is_versioned_and_public(): void
    {
        $this->getJson('/api/v1/health')->assertOk()
            ->assertJsonPath('service', 'restaurantos-api')
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('version', 'v1');
    }

    public function test_readiness_reports_database_connectivity(): void
    {
        DB::shouldReceive('select')->once()->with('SELECT 1')->andReturn([(object) ['?column?' => 1]]);
        $this->getJson('/api/v1/ready')->assertOk()->assertJsonPath('status', 'ready');
    }

    public function test_readiness_fails_closed_without_exposing_connection_details(): void
    {
        DB::shouldReceive('select')->once()->with('SELECT 1')
            ->andThrow(new RuntimeException('password=never-disclose'));
        $response = $this->getJson('/api/v1/ready')->assertStatus(503)
            ->assertJsonPath('status', 'unavailable');
        $this->assertStringNotContainsString('never-disclose', $response->getContent());
    }
}
