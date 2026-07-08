#!/bin/sh
set -e

# Espera a MySQL: `depends_on` solo garantiza que el contenedor arranco,
# no que el motor acepte conexiones.
if [ -n "$DB_HOST" ]; then
  echo "Esperando a MySQL en ${DB_HOST}:${DB_PORT:-3306}..."
  until php -r "new PDO('mysql:host=${DB_HOST};port=${DB_PORT:-3306}', '${DB_USERNAME}', '${DB_PASSWORD}');" 2>/dev/null; do
    sleep 2
  done
fi

if [ ! -f .env ]; then
  cp .env.example .env
fi

if ! grep -q '^APP_KEY=base64:' .env; then
  php artisan key:generate --force
fi

php artisan storage:link || true
php artisan migrate --force

if [ "$SEED_DATABASE" = "true" ]; then
  php artisan db:seed --force
fi

exec "$@"
