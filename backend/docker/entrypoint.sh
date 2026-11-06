#!/bin/sh
set -e

# Espera a MySQL: `depends_on` solo garantiza que el contenedor arranco,
# no que el motor acepte conexiones. La espera es acotada: sin limite, una base
# inalcanzable dejaba el contenedor colgado sin servir ni registrar el motivo
# (deploy fallido por timeout y API sin respuesta). Solo se registra el codigo
# SQLSTATE/driver, nunca host, usuario ni contrasena.
if [ -n "$DB_HOST" ]; then
  db_wait_limit="${DB_WAIT_TIMEOUT:-180}"
  db_waited=0
  echo "Esperando a MySQL en ${DB_HOST}:${DB_PORT:-3306} (maximo ${db_wait_limit}s)..."
  until db_error=$(php -r '
    $options = [];
    if (getenv("MYSQL_ATTR_SSL_CA")) {
        $options[PDO::MYSQL_ATTR_SSL_CA] = getenv("MYSQL_ATTR_SSL_CA");
    }
    try {
        new PDO(
            "mysql:host=".getenv("DB_HOST").";port=".(getenv("DB_PORT") ?: "3306"),
            getenv("DB_USERNAME"),
            getenv("DB_PASSWORD"),
            $options
        );
    } catch (Throwable $e) {
        echo get_class($e)." code ".$e->getCode();
        exit(1);
    }
  ' 2>/dev/null); do
    if [ "$db_waited" -ge "$db_wait_limit" ]; then
      echo "MySQL no disponible tras ${db_waited}s (${db_error:-sin detalle}). Arranque abortado." >&2
      exit 1
    fi
    sleep 2
    db_waited=$((db_waited + 2))
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
