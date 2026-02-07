# PRD - Newsletter Mining App

Version: 1.0  
Date: 2026-02-07  
Owner: Product Team

## 1. Vue d'ensemble

### 1.1 Resume executif
Newsletter Mining est une application personnelle qui analyse automatiquement des newsletters afin de detecter des problemes recurrents, des signaux faibles, et des opportunites produit.

### 1.2 Probleme
Lecture de nombreuses newsletters sans systeme fiable pour:
- detecter des patterns transverses
- voir les tendances emergentes tot
- centraliser les pain points
- transformer la veille en insights actionnables

### 1.3 Solution
Pipeline qui:
1. ingere des newsletters via email dedie
2. extrait les problemes avec LLM
3. clusterise les problemes similaires
4. expose un dashboard exploitable

### 1.4 Objectifs
- Court terme (MVP): valider la detection automatique sur 20-50 newsletters.
- Moyen terme: outil personnel fiable pour l'opportunity discovery.
- Long terme: extension multi-user / verticales.

Decision 2026-02-07:
- Le produit est scope en single-user pour le MVP (usage personnel).

## 2. Personas et use cases

### 2.1 Persona principal
Opportunity Seeker (entrepreneur / indie hacker / product builder) qui consomme 20-100 newsletters et cherche des idees exploitables.

### 2.2 Use cases
- UC1: decouvrir des opportunites emergentes.
- UC2: valider une hypothese de probleme.
- UC3: explorer une verticale et ses top pain points.

## 3. Fonctionnalites MVP

### F1.1 Email ingestion
- Adresse email dediee.
- Reception via webhook (prioritaire) ou IMAP (fallback).
- Stockage metadata + contenu.
- SLA cible: email visible en < 1 min.

### F1.2 Agent d'analyse LLM
- GPT-4o avec prompt structure.
- Extraction JSON:
  - problemes
  - categorie / severite
  - quote / contexte / signaux
  - sentiment global / topics
- Cibles qualite:
  - precision >= 80%
  - faux positifs < 20%
  - processing < 30s / newsletter

### F1.3 Stockage et data model
- `newsletters`, `problems`, `problem_clusters`.
- pgvector pour embeddings.
- indexes sur FK et colonnes critiques.

### F1.4 Clustering
- Embeddings OpenAI `text-embedding-3-small`.
- Similarite cosine, seuil 0.85.
- Attribution cluster existant ou creation cluster.
- Nom + resume cluster via LLM.

### F1.5 Dashboard MVP
- Home: top clusters par `mention_count`.
- Detail cluster: timeline et mentions.
- Newsletters: liste, statut analyse, detail.
- Cibles: < 2s de chargement, responsive desktop/tablet.

### F1.6 Authentification
- Login/signup email+password.
- Isolation stricte des donnees par user.
- Adresse email dediee unique par user.

Note single-user:
- En phase MVP perso, l'auth complete peut etre simplifiee ou deferree.

### F1.7 Groupement thematique des newsletters
- Objectif: regrouper les sources par thematique (ex: `tech`, `bien-etre`, `marketing`, `business`).
- Donnee cible: `source_vertical` au niveau `newsletters`.
- Usage produit:
  - filtre dashboard par thematique
  - comparaison des top problemes par thematique
- Mode MVP recommande:
  - attribution manuelle/semi-automatique par source
  - classification auto LLM en phase suivante

## 4. Architecture technique cible

## 4.1 Stack cible (produit)
- Backend: FastAPI
- Queue: Celery + Redis
- DB: Postgres + pgvector
- Frontend: Next.js
- Email: Mailgun inbound webhook (ou fallback IMAP self-hosted)

## 4.2 Stack actuelle (repo)
- Full-stack Nuxt 3 (API + frontend).
- Postgres + Drizzle + pgvector.
- GPT-4o pour extraction.
- OpenAI embeddings.
- Endpoint webhook Mailgun deja present.

Note: l'implementation actuelle est deja operationnelle pour ingestion/analyse/clustering, mais differente de la stack cible theorique initiale.

## 5. Prompts LLM
- Prompt extraction problemes: structure stricte JSON + categories + severite + signaux.
- Prompt cluster summary: nom cluster (3-6 mots) + resume actionnable.

## 6. Metriques de succes

### 6.1 Produit
- > 10 newsletters forwarded / semaine
- > 3 sessions / semaine
- > 5 min / session
- precision extraction > 80%
- clustering utile > 85% (review manuelle)

### 6.2 Technique
- analyse < 30s
- dashboard < 2s
- uptime ingestion > 99%
- cout LLM < $0.05 / newsletter
- infra MVP < $50 / mois

## 7. Risques et mitigations
- R1 extraction LLM variable -> prompt tuning + validation manuelle.
- R2 cout LLM trop eleve -> rate limits, batch, modele plus petit.
- R3 clustering imparfait -> tuning seuil + metadata.
- R4 peu de problemes explicites -> etendre sources (forums, social).
- R5 faible volume forward -> onboarding + auto-forward.

## 8. Roadmap
- Phase 0 (1-2 semaines): validation prototype sur corpus limite.
- Phase 1 (4-6 semaines): ingestion, analyse, clustering, dashboard, groupement thematique, staging.
- Phase 2: emerging signals, filtres verticaux, recherche avancee, analytics.
- Phase 3: scale multi-user et integrations.

## 9. Open questions
- Upload manuel `.eml` en MVP ou phase 2.
- Detection des solutions en plus des problemes.
- Controle manuel merge/split clusters.
- Privacy policy / GDPR pour contenus email.

## 10. Success criteria MVP
Le MVP est valide si:
1. 50 newsletters analysees sans crash (> 95% succes).
2. Precision extraction > 80%.
3. >= 10 clusters utiles.
4. >= 3 insights actionnables en 2 semaines.
5. Perf acceptable (dashboard < 3s, analyse < 1 min).

## Addendum infra retenue (2026-02-07)
- Hebergement: VPS perso.
- Domaine: chez Hostinger.
- Ingestion: sous-domaine Mailgun (`newsletters.<domaine>`), webhook vers l'app VPS.
- Etat: compte Mailgun a creer et brancher (DNS + signing key).
- Scope user: single-user (toi uniquement) pour le MVP.
