# syntax=docker/dockerfile:1

# FrankenPHP (Caddy + PHP en un solo proceso, hilos de PHP en paralelo) en lugar de
# `php artisan serve`, que es el servidor de desarrollo de PHP: un unico hilo, sin
# gestion de concurrencia. Laravel corre en modo clasico (sin Octane).
FROM dunglas/frankenphp:1-php8.4-alpine

RUN apk add --no-cache git unzip \
    && install-php-extensions pdo_mysql pdo_pgsql pdo_sqlite intl zip exif opcache \
    && rm -rf /var/cache/apk/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY docker/php.ini /usr/local/etc/php/conf.d/zz-lumaflow.ini
COPY docker/Caddyfile /etc/caddy/Caddyfile

WORKDIR /app

# Las dependencias se instalan antes que el codigo para aprovechar la cache de
# capas: solo se reinstalan cuando cambian composer.json o composer.lock.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# El puerto lo fija PORT (Render usa 10000).
ENV PORT=8000
EXPOSE 8000

ENTRYPOINT ["entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
