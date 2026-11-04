FROM php:8.4-fpm-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip libpq-dev libonig-dev libxml2-dev libcurl4-openssl-dev \
    && docker-php-ext-install pdo_pgsql mbstring curl dom xml \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
COPY infra/docker/start-api.sh /opt/restaurantos/start-api.sh
WORKDIR /var/www/html
EXPOSE 9000
CMD ["php-fpm"]
