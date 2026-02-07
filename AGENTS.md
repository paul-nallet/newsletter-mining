# AGENTS.md

## Mission
Newsletter Mining aide un entrepreneur a detecter des problemes recurents dans des newsletters pour trouver des opportunites produit.

## Scope utilisateur
- Produit utilise en mode personnel (single-user) pour le moment.
- Pas de besoin immediate de multi-tenant ni de separation inter-users.

## Etat actuel du projet
- `src/newsletter_mining/*`: CLI Python pour analyser des fichiers locaux (`analyze`, `cluster`, `report`).
- `web/*`: application Nuxt 3 full-stack (UI + API server).
- `web/server/api/webhooks/mailgun.post.ts`: ingestion email en webhook Mailgun avec verification de signature.
- `web/server/services/analyzer.ts`: extraction des problemes via GPT-4o.
- `web/server/services/embeddings.ts`: embeddings OpenAI (`text-embedding-3-small`).
- `web/server/services/clustering.ts`: clustering cosine avec seuil 0.85.
- `web/server/database/schema.ts`: schema Postgres + pgvector.
- `docker-compose.yml`: Postgres (image `pgvector/pgvector:pg16`).

## Decision infra email (VPS + Hostinger + Mailgun)
- Domaine principal garde chez Hostinger.
- Sous-domaine dedie ingestion (ex: `newsletters.ton-domaine.com`) configure dans DNS Hostinger vers Mailgun.
- Mailgun recoit les emails inbound et appelle le webhook de l'app:
  - `POST /api/webhooks/mailgun`
- Le webhook insere la newsletter, puis declenche l'analyse automatiquement.
- Compte Mailgun: a creer, puis ajouter sa cle de signature dans l'env.

## Variables d'environnement requises
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `MAILGUN_WEBHOOK_SIGNING_KEY`

## Commandes utiles
- Python CLI:
  - `uv run python -m newsletter_mining analyze samples/`
  - `uv run python -m newsletter_mining cluster`
  - `uv run python -m newsletter_mining report`
- Web app:
  - `cd web && npm install`
  - `cd web && npm run dev`
  - `cd web && npm run build`
  - `cd web && npm run db:generate`
  - `cd web && npm run db:migrate`

## Priorites produit (MVP)
1. Pipeline email inbound stable (Mailgun webhook).
2. Qualite extraction des problemes (precision > 80%).
3. Clustering utile et lisible dans dashboard.
4. Groupement thematique des newsletters (ex: tech, bien-etre, marketing).
5. Observabilite et fiabilite en prod VPS.

## Gaps connus vs PRD
- Authentification multi-user non necessaire en phase single-user (deferree).
- Task queue async dediee (type Celery/Redis) non implementee.
- Incremental clustering avance (recompute intelligent) a renforcer.
- Alertes "emerging signals" non implementees.

## Regles de contribution
- Garder la logique email webhook et sa verification de signature intactes.
- Eviter les breaking changes de schema sans migration.
- Ajouter logs explicites sur ingestion/analyse/clustering.
- Documenter toute nouvelle variable d'environnement.
