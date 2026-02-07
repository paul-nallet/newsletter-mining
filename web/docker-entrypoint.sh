#!/bin/sh
set -eu

if [ "${SKIP_DB_MIGRATIONS:-0}" = "1" ]; then
  echo "SKIP_DB_MIGRATIONS=1, starting app without running migrations."
  exec node .output/server/index.mjs
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set. Cannot run DB migrations."
  exit 1
fi

echo "Waiting for PostgreSQL..."
until pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; do
  sleep 2
done

echo "Ensuring pgvector extension..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c 'CREATE EXTENSION IF NOT EXISTS vector;'

echo "Ensuring migration metadata table..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c 'CREATE TABLE IF NOT EXISTS _app_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());'

for file in /app/migrations/*.sql; do
  [ -f "$file" ] || continue
  name="$(basename "$file")"
  applied="$(psql "$DATABASE_URL" -tAc "SELECT 1 FROM _app_migrations WHERE name = '$name' LIMIT 1;")"
  if [ "$applied" = "1" ]; then
    echo "Skipping already applied migration: $name"
    continue
  fi

  echo "Applying migration: $name"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO _app_migrations (name) VALUES ('$name') ON CONFLICT (name) DO NOTHING;"
done

echo "Starting Nuxt server..."
exec node .output/server/index.mjs
