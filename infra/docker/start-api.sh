#!/bin/sh
set -eu

# Local development only. Production must provision APP_KEY and dependencies separately.
if [ ! -f .env ]; then cp .env.example .env; fi
composer install --no-interaction --prefer-dist
if ! grep -Eq '^APP_KEY=.{5,}' .env; then
    php artisan key:generate --no-interaction
fi
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs
exec php-fpm
