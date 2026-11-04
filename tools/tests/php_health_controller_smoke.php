<?php

/**
 * Dependency-free smoke test for the real controller methods, run against
 * stand-ins. This does not replace Laravel HTTP/database integration tests.
 */
namespace Illuminate\Http {
    class JsonResponse
    {
        public array $headers = [];
        public function __construct(public array $payload, public int $status = 200) {}
        public function header(string $name, string $value): static
        {
            $this->headers[$name] = $value;
            return $this;
        }
    }
}
namespace Illuminate\Support\Facades {
    class DB
    {
        public static bool $available = true;
        public static int $calls = 0;
        public static function select(string $query): array
        {
            if ($query !== 'SELECT 1') throw new \RuntimeException('Unexpected readiness query');
            self::$calls++;
            if (!self::$available) throw new \RuntimeException('secret=do-not-expose');
            return [(object) ['check' => 1]];
        }
    }
}
namespace {
    use App\Http\Controllers\Api\V1\HealthController;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Support\Facades\DB;

    function response(): object
    {
        return new class {
            public function json(array $body, int $status = 200): JsonResponse
            {
                return new JsonResponse($body, $status);
            }
        };
    }
    function report(\Throwable $exception): void {}
    require __DIR__.'/../../apps/api/app/Http/Controllers/Controller.php';
    require __DIR__.'/../../apps/api/app/Http/Controllers/Api/V1/HealthController.php';

    function expect(bool $condition, string $message): void
    {
        if (!$condition) throw new \RuntimeException('FAIL: '.$message);
    }
    $controller = new HealthController;
    $live = $controller->live();
    expect($live->status === 200 && $live->payload['status'] === 'ok', 'liveness');
    expect($live->payload['version'] === 'v1' && $live->headers['Cache-Control'] === 'no-store', 'contract');

    $ready = $controller->ready();
    expect($ready->status === 200 && $ready->payload['status'] === 'ready', 'readiness');
    DB::$available = false;
    $unavailable = $controller->ready();
    expect($unavailable->status === 503 && $unavailable->payload['status'] === 'unavailable', 'DB failure');
    expect(!str_contains(json_encode($unavailable->payload), 'secret='), 'no leak');
    expect(DB::$calls === 2, 'DB queried twice');
    echo "PASS: 5 controller assertions, real HealthController methods, mock response/DB (not Laravel integration)\n";
}
