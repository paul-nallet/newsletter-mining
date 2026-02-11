#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

MIGRATIONS_DIR="/app/server/database/migrations"

echo "Waiting for PostgreSQL..."
until pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; do
  sleep 2
done

echo "Ensuring pgvector extension..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c 'CREATE EXTENSION IF NOT EXISTS vector;'

echo "Ensuring migration tracking table..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c \
  'CREATE TABLE IF NOT EXISTS _app_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());'

applied=0
skipped=0

for file in "$MIGRATIONS_DIR"/*.sql; do
  [ -f "$file" ] || continue
  name="$(basename "$file")"

  already="$(psql "$DATABASE_URL" -tAc "SELECT 1 FROM _app_migrations WHERE name = '$name' LIMIT 1;" 2>/dev/null || true)"
  if [ "$already" = "1" ]; then
    echo "SKIP  $name (already applied)"
    skipped=$((skipped + 1))
    continue
  fi

  echo "APPLY $name ..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f "$file"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c \
    "INSERT INTO _app_migrations (name) VALUES ('$name') ON CONFLICT (name) DO NOTHING;"
  applied=$((applied + 1))
done

echo ""
echo "Done. Applied: $applied, Skipped: $skipped."
