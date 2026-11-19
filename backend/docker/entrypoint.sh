#!/bin/sh
set -e

# Espera a la base de datos: `depends_on` solo garantiza que el contenedor arranco,
# no que el motor acepte conexiones. Con limite: si nunca responde, `migrate` falla con un
# error claro en vez de dejar el arranque colgado sin abrir el puerto.
if [ -n "$DB_HOST" ]; then
  echo "Esperando a ${DB_CONNECTION:-mysql} en ${DB_HOST}:${DB_PORT:-3306}..."
  attempts=0
  until php -r '
    $options = [PDO::ATTR_TIMEOUT => 5];
    if (getenv("DB_CONNECTION") === "pgsql") {
        new PDO(
            "pgsql:host=".getenv("DB_HOST").";port=".(getenv("DB_PORT") ?: "5432").";dbname=".(getenv("DB_DATABASE") ?: "postgres").";sslmode=".(getenv("DB_SSLMODE") ?: "prefer"),
            getenv("DB_USERNAME"),
            getenv("DB_PASSWORD"),
            $options
        );
    } else {
        if (getenv("MYSQL_ATTR_SSL_CA")) {
            $options[PDO::MYSQL_ATTR_SSL_CA] = getenv("MYSQL_ATTR_SSL_CA");
        }
        new PDO(
            "mysql:host=".getenv("DB_HOST").";port=".(getenv("DB_PORT") ?: "3306"),
            getenv("DB_USERNAME"),
            getenv("DB_PASSWORD"),
            $options
        );
    }
  ' 2>/dev/null; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 15 ]; then
      echo "La base de datos no responde tras ${attempts} intentos; continuo para que migrate informe del error."
      break
    fi
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
