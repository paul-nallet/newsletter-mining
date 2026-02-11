# Newsletter Mining

Extract problems and pain-points from newsletters using LLMs.

## Setup

```bash
cp .env.example .env
# Fill in your API keys in .env

# Required for web auth
# BETTER_AUTH_SECRET=<random-32+-chars>
# BETTER_AUTH_URL=http://localhost:3000

uv sync
```

### Environment variables

- `OPENAI_API_KEY`
- `MAILGUN_WEBHOOK_SIGNING_KEY`
- `DATABASE_URL`
- `CLUSTER_SIMILARITY_THRESHOLD` (default `0.78`, lower = broader clusters, higher = stricter clusters)
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`

## Usage

```bash
# Analyze a newsletter file
uv run python -m newsletter_mining analyze samples/example.html

# Analyze all files in a directory
uv run python -m newsletter_mining analyze samples/

# Cluster extracted problems
uv run python -m newsletter_mining cluster

# Display report
uv run python -m newsletter_mining report
```

## Web App (Nuxt + Better Auth)

```bash
cd web
npm install

# Optional: regenerate Better Auth SQL (only when auth config changes)
npm run auth:generate

# Apply Better Auth migrations
npm run auth:migrate

# Existing business schema migrations
npm run db:migrate

# Run app
npm run dev
```

### Production migration order

Production uses the SQL migration stack in `/app/server/database/migrations` via `/app/db-migrate.sh`.
Do not rely on `better-auth migrate` alone in production.

If Stripe callback fails with `column "cancelAt" does not exist`, run this hotfix immediately:

```sql
ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "cancelAt" timestamp with time zone;
ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "canceledAt" timestamp with time zone;
ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "endedAt" timestamp with time zone;
ALTER TABLE "subscription" ALTER COLUMN "status" SET DEFAULT 'incomplete';
UPDATE "subscription" SET "status" = 'incomplete' WHERE "status" IS NULL;
```

Then deploy the repository migration files and run `/app/db-migrate.sh` (or start the container with migrations enabled).

### Auth behavior (MVP)

- Email/password authentication enabled.
- UI routes are protected; unauthenticated users are redirected to `/login`.
- Single-user strict mode: only the first signup is allowed, then registration is closed.
- Existing business APIs remain unchanged (not session-protected yet).
- Mailgun webhook `/api/webhooks/mailgun` remains unchanged.

## Supported formats

- HTML (`.html`, `.htm`)
- Email (`.eml`)
- Plain text (`.txt`)
