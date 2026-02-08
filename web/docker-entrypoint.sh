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

has_bootstrap_schema() {
  enums_exist="$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname IN ('category','severity','source_type','trend');")"
  tables_exist="$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('newsletters','problems','problem_clusters');")"
  [ "${enums_exist:-0}" -ge 4 ] && [ "${tables_exist:-0}" -ge 3 ]
}

has_better_auth_schema() {
  auth_tables_exist="$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user','session','account','verification');")"
  [ "${auth_tables_exist:-0}" -ge 4 ]
}

mark_applied() {
  migration_name="$1"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO _app_migrations (name) VALUES ('$migration_name') ON CONFLICT (name) DO NOTHING;"
}

apply_migration_file() {
  file="$1"
  [ -f "$file" ] || return 0
  name="$(basename "$file")"
  applied="$(psql "$DATABASE_URL" -tAc "SELECT 1 FROM _app_migrations WHERE name = '$name' LIMIT 1;")"
  if [ "$applied" = "1" ]; then
    echo "Skipping already applied migration: $name"
    return 0
  fi

  # Recovery path for pre-existing bootstrap schema:
  # if migration metadata is missing but schema objects already exist, mark it as applied.
  if [ "$name" = "0000_true_kinsey_walden.sql" ] && has_bootstrap_schema; then
    echo "Detected existing bootstrap schema for $name; marking as applied."
    mark_applied "$name"
    return 0
  fi
  if [ "$name" = "0001_better_auth.sql" ] && has_better_auth_schema; then
    echo "Detected existing Better Auth schema for $name; marking as applied."
    mark_applied "$name"
    return 0
  fi

  echo "Applying migration: $name"
  if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f "$file"; then
    mark_applied "$name"
    return 0
  fi

  # Last-resort recovery for bootstrap migration if a partial schema already exists.
  if [ "$name" = "0000_true_kinsey_walden.sql" ] && has_bootstrap_schema; then
    echo "Bootstrap migration failed but schema already exists; marking as applied."
    mark_applied "$name"
    return 0
  fi
  if [ "$name" = "0001_better_auth.sql" ] && has_better_auth_schema; then
    echo "Better Auth migration failed but schema already exists; marking as applied."
    mark_applied "$name"
    return 0
  fi

  echo "Migration failed: $name"
  return 1
}

for file in /app/migrations/*.sql; do
  apply_migration_file "$file"
done

echo "Starting Nuxt server..."
exec node .output/server/index.mjs
