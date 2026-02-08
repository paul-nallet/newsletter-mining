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

# Generate Better Auth SQL migration (separate from Drizzle business schema)
npm run auth:generate

# Apply Better Auth migrations
npm run auth:migrate

# Existing business schema migrations
npm run db:migrate

# Run app
npm run dev
```

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
