#!/bin/sh
# wait_for_db.sh - wait until Postgres is accepting connections
# Usage: this script should be used as entrypoint and the CMD will be executed after DB is ready

set -e

: ${DATABASE_URL:=}
# Allow overriding DB host/port/user via env, default to compose service names
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-account}
DB_NAME=${DB_NAME:-account_db}

echo "Waiting for database ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}..."

# loop until pg_isready returns success
until pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; do
  echo "Postgres is unavailable - sleeping 2s"
  sleep 2
done

echo "Postgres is up - starting process"

# exec the CMD
exec "$@"
