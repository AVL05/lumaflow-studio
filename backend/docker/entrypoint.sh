#!/bin/sh
set -e

# Espera a MySQL: `depends_on` solo garantiza que el contenedor arranco,
# no que el motor acepte conexiones.
if [ -n "$DB_HOST" ]; then
  echo "Esperando a MySQL en ${DB_HOST}:${DB_PORT:-3306}..."
  until php -r '
    $options = [];
    if (getenv("MYSQL_ATTR_SSL_CA")) {
        $options[PDO::MYSQL_ATTR_SSL_CA] = getenv("MYSQL_ATTR_SSL_CA");
    }
    new PDO(
        "mysql:host=".getenv("DB_HOST").";port=".(getenv("DB_PORT") ?: "3306"),
        getenv("DB_USERNAME"),
        getenv("DB_PASSWORD"),
        $options
    );
  ' 2>/dev/null; do
    sleep 2
  done
fi

if [ ! -f .env ] && [ "${APP_ENV:-local}" != "production" ]; then
  cp .env.example .env
fi

case "$APP_KEY" in
  base64:*) ;;
  ?*) export APP_KEY="base64:${APP_KEY}" ;;
esac

if [ -z "$APP_KEY" ] && { [ ! -f .env ] || ! grep -q '^APP_KEY=base64:' .env; }; then
  [ -f .env ] || cp .env.example .env
  php artisan key:generate --force
fi

php artisan storage:link || true
php artisan migrate --force

if [ "$SEED_DATABASE" = "true" ]; then
  php artisan db:seed --force
fi

if [ "${APP_ENV:-local}" = "production" ]; then
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
fi

exec "$@"
