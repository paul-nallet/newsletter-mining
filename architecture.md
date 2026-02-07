# Architecture - Newsletter Mining

## 1. Objectif
Transformer des newsletters en insights actionnables:
- ingestion email
- extraction de problemes par LLM
- clustering des problemes similaires
- visualisation dans un dashboard web

## 2. Stack actuelle (repo)
- Frontend + API: Nuxt 3 (`web/`)
- DB: PostgreSQL + pgvector
- ORM: Drizzle
- LLM extraction: OpenAI GPT-4o
- Embeddings: OpenAI `text-embedding-3-small`
- Prototype local: CLI Python (`src/newsletter_mining`)

## 3. Architecture logique

### 3.1 Ingestion email
1. Email recu sur Mailgun (inbound route).
2. Mailgun appelle `POST /api/webhooks/mailgun`.
3. L'API verifie `timestamp + token + signature` avec `MAILGUN_WEBHOOK_SIGNING_KEY`.
4. L'API extrait `subject`, `sender`, `body-html`, `body-plain`, `stripped-text`.
5. Newsletter sauvegardee en DB (`newsletters`).
6. Analyse auto declenchee sur `/api/newsletters/:id/analyze`.

### 3.2 Analyse LLM
1. Chargement du `textBody`.
2. Prompt structure (problemes, signaux, categorie, severite, etc.).
3. Appel GPT-4o et parsing JSON.
4. MAJ metadata newsletter (`analyzed`, `overallSentiment`, `keyTopics`).
5. Insertion des problemes en table `problems`.
6. Generation embedding pour chaque probleme.

### 3.3 Clustering
1. Recuperation des problemes avec embeddings.
2. Similarite cosine vs centroid des clusters.
3. Attribution si `sim >= 0.85`, sinon nouveau cluster.
4. Enrichissement nom + resume cluster via GPT-4o.
5. Sauvegarde en table `problem_clusters`.

### 3.4 Dashboard
- Home: clusters classes par `mention_count`.
- Newsletters: liste des newsletters + statut analyse.
- Details newsletter et cluster via endpoints dedies.

## 4. Schema de donnees
- `newsletters`: metadata email, contenu, statut analyse, sentiment.
- `problems`: problemes extraits, citation, contexte, severite, embedding.
- `problem_clusters`: regroupements, trend, fenetre temporelle.

Note: `newsletters.source_vertical` existe deja et peut etre utilise pour stocker la thematique source (ex: `tech`, `bien-etre`, `business`, `marketing`).

## 4.1 Groupement thematique (single-user)
Approche recommandee MVP:
1. Tag theme au niveau newsletter (`source_vertical`).
2. Attribution initiale manuelle ou semi-automatique par source email.
3. Filtrage dashboard par theme.
4. Option phase suivante: classification auto LLM de la thematique.

## 5. Deploiement cible (VPS)

## 5.1 Services
- `postgres` (docker, pgvector)
- `newsletter-mining-web` (Nuxt server, idealement en conteneur)
- reverse proxy HTTPS (Nginx/Caddy)

## 5.2 Flux reseau
1. DNS Hostinger:
   - app: `app.ton-domaine.com` -> VPS
   - sous-domaine Mailgun: `newsletters.ton-domaine.com` -> MX/TXT Mailgun
2. Mailgun inbound route:
   - `*@newsletters.ton-domaine.com` -> `https://app.ton-domaine.com/api/webhooks/mailgun`

## 5.3 Variables d'env prod
- `DATABASE_URL=postgresql://...`
- `OPENAI_API_KEY=...`
- `MAILGUN_WEBHOOK_SIGNING_KEY=...`

## 6. Pourquoi Mailgun + Hostinger
- Pas de polling IMAP (latence et complexite).
- Webhook quasi temps reel.
- Domaine principal reste chez Hostinger.
- Separation propre entre domaine web et sous-domaine ingestion.

## 7. Fallback
Si Mailgun n'est pas pret:
- polling IMAP Hostinger possible (script cron),
- mais moins fiable et moins reactif que le webhook.

## 8. Gaps a traiter pour la prod
- Auth multi-user (deferree tant que produit perso single-user).
- Queue async robuste (pour decoupler webhook et analyse).
- Monitoring/alerting et retries.
- Sauvegarde DB et retention des donnees.
