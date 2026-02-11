#!/bin/sh
set -eu

# Reset targeted auth + billing data for retesting OAuth/checkout flows.
# This script does NOT drop the whole database.

YES=0
NO_BACKUP=0
SKIP_MIGRATE=0
BACKUP_DIR="${BACKUP_DIR:-/tmp}"

usage() {
  cat <<'EOF'
Usage:
  sh ./reset-auth-billing.sh --yes [--no-backup] [--skip-migrate] [--backup-dir /path]

Options:
  --yes            Required. Confirms destructive reset of auth/billing tables.
  --no-backup      Skip pg_dump backup before reset.
  --skip-migrate   Skip running ./db-migrate.sh after reset.
  --backup-dir     Directory for dump file (default: /tmp or $BACKUP_DIR).
  --help           Show this help.

Required env:
  DATABASE_URL
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --yes)
      YES=1
      shift
      ;;
    --no-backup)
      NO_BACKUP=1
      shift
      ;;
    --skip-migrate)
      SKIP_MIGRATE=1
      shift
      ;;
    --backup-dir)
      if [ "$#" -lt 2 ]; then
        echo "ERROR: --backup-dir requires a value."
        exit 1
      fi
      BACKUP_DIR="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if [ "$YES" -ne 1 ]; then
  echo "ERROR: This operation is destructive. Re-run with --yes."
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql is required but not found."
  exit 1
fi

echo "Waiting for PostgreSQL..."
until pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; do
  sleep 2
done

mkdir -p "$BACKUP_DIR"
timestamp="$(date +%Y%m%d-%H%M%S)"
backup_file="$BACKUP_DIR/news-mining-auth-billing-$timestamp.dump"

if [ "$NO_BACKUP" -eq 0 ]; then
  if ! command -v pg_dump >/dev/null 2>&1; then
    echo "ERROR: pg_dump is required for backup. Use --no-backup to bypass."
    exit 1
  fi
  echo "Creating backup: $backup_file"
  pg_dump "$DATABASE_URL" -Fc -f "$backup_file"
else
  echo "Skipping backup (--no-backup)."
fi

echo "Resetting auth/billing tables..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE
  target_tables text[] := ARRAY[
    'session',
    'account',
    'verification',
    'subscription',
    'analysis_credit_months',
    'analysis_credit_reservations',
    'user_profiles',
    'user'
  ];
  existing_tables text[];
  stmt text;
BEGIN
  SELECT array_agg(t)
  INTO existing_tables
  FROM unnest(target_tables) AS t
  JOIN pg_tables p
    ON p.schemaname = 'public'
   AND p.tablename = t;

  IF existing_tables IS NULL OR array_length(existing_tables, 1) IS NULL THEN
    RAISE EXCEPTION 'No target tables found in schema public.';
  END IF;

  SELECT 'TRUNCATE TABLE ' || string_agg(format('%I', t), ', ') || ' CASCADE'
  INTO stmt
  FROM unnest(existing_tables) AS t;

  EXECUTE stmt;
END $$;
SQL

echo "Reset complete."

if [ "$SKIP_MIGRATE" -eq 0 ]; then
  script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
  migrate_script="$script_dir/db-migrate.sh"

  if [ ! -f "$migrate_script" ]; then
    echo "ERROR: Could not find db-migrate.sh next to this script."
    exit 1
  fi

  echo "Re-applying SQL migrations..."
  sh "$migrate_script"
else
  echo "Skipping migrations (--skip-migrate)."
fi

echo "Done."
if [ "$NO_BACKUP" -eq 0 ]; then
  echo "Backup file: $backup_file"
fi
