import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getApiHealth, HealthApiError, parseApiHealth } from './health.ts';

describe('RestaurantOS versioned API health client (offline unit tests)', () => {
  it('validates an actual health payload', () => {
    assert.deepEqual(parseApiHealth({ service: 'restaurantos-api', status: 'ok', version: 'v1' }), {
      service: 'restaurantos-api', status: 'ok', version: 'v1',
    });
  });

  it('rejects malformed, non-v1 and false-success payloads', () => {
    for (const payload of [null, {}, { status: 'ok' }, { service: 'restaurantos-api', status: 'failed', version: 'v1' }, { service: 'restaurantos-api', status: 'ok', version: 'v2' }]) {
      assert.throws(() => parseApiHealth(payload), HealthApiError);
    }
  });

  it('requests the real versioned path with same-origin credentials and no caching', async () => {
    let called = false;
    const health = await getApiHealth(async (url, options) => {
      called = true;
      assert.equal(url, '/api/v1/health');
      assert.equal(options.credentials, 'same-origin');
      assert.equal(options.cache, 'no-store');
      assert.deepEqual(options.headers, { Accept: 'application/json' });
      return new Response(JSON.stringify({ service: 'restaurantos-api', status: 'ok', version: 'v1' }), { status: 200 });
    });
    assert.ok(called);
    assert.equal(health.status, 'ok');
  });

  it('does not report HTTP 503 as healthy', async () => {
    await assert.rejects(
      () => getApiHealth(async () => new Response('{"status":"unavailable"}', { status: 503 })),
      /HTTP 503/,
    );
  });

  it('handles malformed JSON and transport failures without leaking transport details', async () => {
    await assert.rejects(() => getApiHealth(async () => new Response('{bad', { status: 200 })), /Invalid JSON/);
    await assert.rejects(() => getApiHealth(async () => { throw new Error('secret network detail'); }), /Unable to connect/);
  });
});
