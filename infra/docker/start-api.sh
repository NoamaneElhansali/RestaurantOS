#!/bin/sh
set -eu

# Local development only. Production must provision APP_KEY and dependencies separately.
if [ ! -f .env ]; then cp .env.example .env; fi
composer install --no-interaction --prefer-dist
if ! grep -Eq '^APP_KEY=.{5,}' .env; then
    php artisan key:generate --no-interaction
fi
mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs
# PHP-FPM runs as www-data, while bind-mounted source often belongs to the host UID.
# Restrict writable ownership to Laravel's runtime directories only.
chown -R www-data:www-data storage bootstrap/cache
exec php-fpm
