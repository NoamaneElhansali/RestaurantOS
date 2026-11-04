import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const json = (path) => JSON.parse(read(path));

describe('RestaurantOS foundation consistency (source-level checks, not integration)', () => {
  it('declares the supported application framework stack', () => {
    const php = json('apps/api/composer.json');
    const web = json('apps/web/package.json');
    assert.match(php.require['laravel/framework'], /13/);
    assert.ok(php.require['laravel/sanctum']);
    assert.ok(web.dependencies.react);
    assert.ok(web.devDependencies.vite);
    assert.ok(web.dependencies['@tanstack/react-query']);
    assert.ok(web.dependencies['react-i18next']);
    assert.ok(web.devDependencies.vitest);
  });

  it('keeps the API version and health path aligned', () => {
    assert.match(read('apps/api/routes/api.php'), /prefix\('v1'\)/);
    assert.match(read('apps/api/routes/api.php'), /get\('\/health'/);
    assert.match(read('apps/web/src/lib/health.ts'), /'\/api\/v1\/health'/);
  });

  it('does not use wildcard CORS origins with credentials', () => {
    const cors = read('apps/api/config/cors.php');
    assert.match(cors, /'supports_credentials'\s*=>\s*true/);
    assert.doesNotMatch(cors, /'allowed_origins'\s*=>\s*\['\*'\]/);
    assert.match(cors, /FRONTEND_ORIGINS/);
  });

  it('defines the backing Postgres and proxy services', () => {
    const compose = read('compose.yaml');
    for (const name of ['postgres:', 'api:', 'nginx:', 'web:']) assert.ok(compose.includes(name));
    assert.match(compose, /pg_isready/);
    assert.match(compose, /127\.0\.0\.1:8000:80/);
    assert.match(compose, /127\.0\.0\.1:5173:5173/);
  });

  it('defines a token for every semantic Tailwind color used by components', () => {
    const tokens = new Set([...read('apps/web/src/styles.css').matchAll(/--color-(rs-[\w-]+):/g)].map((match) => match[1]));
    for (const file of ['apps/web/src/App.tsx', 'apps/web/src/components/StatusPanel.tsx', 'apps/web/src/components/Button.tsx']) {
      const contents = read(file);
      for (const match of contents.matchAll(/(?:bg|text|border|outline)-(rs-[\w-]+)/g)) {
        assert.ok(tokens.has(match[1]), `${file}: missing ${match[1]}`);
      }
    }
  });

  it('does not contain local env files or vendor dependencies', () => {
    for (const path of ['apps/api/.env', 'apps/web/.env', 'apps/api/vendor', 'apps/web/node_modules']) {
      assert.equal(existsSync(resolve(root, path)), false, `${path} should not be distributed`);
    }
  });
});
