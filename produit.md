# Produit - Recap projet Newsletter Mining

## 1. Vision produit
Construire un systeme perso qui transforme des newsletters en opportunites produit:
- collecter les newsletters
- extraire les problemes recurents
- clusteriser les signaux
- afficher des insights actionnables

Mode d'usage actuel:
- Produit personnel, single-user (toi seul).

## 2. Decision technique actuelle
- Hebergement sur ton VPS.
- Domaine principal gere chez Hostinger.
- Ingestion email via Mailgun (webhook temps reel) sur un sous-domaine dedie.
- Hostinger IMAP garde comme fallback uniquement.

## 3. Pourquoi ce setup
- Pas de latence de polling IMAP.
- Pipeline plus propre: email -> webhook -> DB -> analyse -> dashboard.
- Pas de migration complete de domaine.
- Separation claire entre site principal et email d'ingestion.

## 4. Etat du projet dans le repo
- Ingestion Mailgun deja codee: `web/server/api/webhooks/mailgun.post.ts`
- Analyse LLM deja codee: `web/server/services/analyzer.ts`
- Embeddings + clustering deja codes:
  - `web/server/services/embeddings.ts`
  - `web/server/services/clustering.ts`
- DB schema pgvector present: `web/server/database/schema.ts`
- Dashboard Nuxt deja present (`web/pages/*`)
- Docker compose DB present (`docker-compose.yml`)

## 5. Ce qui reste pour aller en prod VPS

### 5.1 Infra
- Exposer l'app web en HTTPS sur ton VPS (`app.ton-domaine.com`).
- Lancer Postgres pgvector + app avec variables d'environnement.

### 5.2 Mailgun
- Creer le compte Mailgun.
- Ajouter le domaine `newsletters.ton-domaine.com` dans Mailgun.
- Copier les records DNS fournis par Mailgun dans Hostinger:
  - MX `mxa.mailgun.org`, `mxb.mailgun.org`
  - TXT SPF
  - TXT DKIM
- Configurer la route inbound:
  - `*@newsletters.ton-domaine.com` -> `https://app.ton-domaine.com/api/webhooks/mailgun`
- Ajouter `MAILGUN_WEBHOOK_SIGNING_KEY` en env sur le VPS.

### 5.3 Validation
- Envoyer un email test vers `test@newsletters.ton-domaine.com`.
- Verifier insertion dans `newsletters`.
- Verifier analyse auto + creation de `problems`.
- Verifier generation de clusters depuis le dashboard.

## 6. Scope MVP confirme
- Ingestion email dediee.
- Extraction LLM de pain points.
- Clustering par embeddings.
- Dashboard de consultation.
- Groupement thematique des newsletters (ex: tech, bien-etre).

Hors scope immediate:
- auth multi-user (deferre)
- alertes emerging signals
- filtres avances et exports riches

## 6.1 Proposition simple pour les thematiques
- Utiliser `source_vertical` sur chaque newsletter.
- Commencer avec une liste courte:
  - `tech`
  - `bien-etre`
  - `business`
  - `marketing`
  - `autre`
- Attribution:
  - v1 manuelle (ou mapping par sender)
  - v2 automatique via LLM/classification

## 7. Synthese
Tu as deja une base technique solide pour le MVP. Le prochain vrai blocage n'est pas le code principal, c'est la mise en place Mailgun (compte + DNS + route webhook) puis le deploiement VPS en HTTPS.
