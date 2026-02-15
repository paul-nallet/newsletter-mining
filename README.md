# ScopeSight

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
- `MAILGUN_WEBHOOK_MAX_AGE_SECONDS` (default `900`, reject stale Mailgun signatures to reduce replay risk)
- `INGEST_EMAIL_DOMAIN` (default `ingest.scopesight.app`, used to generate per-user ingest addresses)
- `DATABASE_URL`
- `CLUSTER_SIMILARITY_THRESHOLD` (default `0.78`, lower = broader clusters, higher = stricter clusters)
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `ADMIN_EMAIL` (optional, grants access to `/app/admin/users` for this email only)
- `GOOGLE_CLIENT_ID` (optional, for Google SSO)
- `GOOGLE_CLIENT_SECRET` (optional, for Google SSO)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_PRICE_STARTER_YEARLY` (optional, falls back to monthly Mini/starter price)
- `STRIPE_PRICE_GROWTH_MONTHLY`
- `STRIPE_PRICE_GROWTH_YEARLY`
- `STRIPE_PRICE_STUDIO_MONTHLY`
- `STRIPE_PRICE_STUDIO_YEARLY`

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

### Google SSO setup

To enable Google login:

1. Create OAuth credentials in Google Cloud Console.
2. Add redirect URIs:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
3. Set env vars:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
4. Ensure `BETTER_AUTH_URL` matches your app domain in production to avoid `redirect_uri_mismatch`.

### Billing flow (Mini 5)

- The app supports a Stripe `starter` plan displayed as `Mini` at `$5/month`.
- Flow is `Auth -> /app/upgrade -> Stripe Checkout`.
- Growth and Studio use a 14-day free trial (card required at checkout).
- Mini/starter has no free trial.
- Downgrade from paid plan is done at period end via `Passer a Mini (fin de periode)` in Settings.
- In lightweight mode, users may temporarily have no active subscription after a paid subscription ends.

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
