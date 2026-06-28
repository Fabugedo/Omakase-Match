# Quickstart & Validation: Anime Recommendations

This guide proves the feature works end-to-end locally. It describes the *run & verify* path; the
concrete build steps live in `tasks.md` (created by `/speckit-tasks`).

## Prerequisites

- Docker + Docker Compose (Postgres, backend, frontend, NGINX)
- Node.js 22 + npm (for running tests / the ingestion script outside Docker if preferred)
- A backend `.env` (copy `.env.example` → `backend/.env`) containing at least:
  - `DATABASE_URL=postgresql://omakase:omakase@db:5432/omakase`
  - `ANTHROPIC_API_KEY=...`  ← real key, **never committed**
  - `ANTHROPIC_MODEL=claude-haiku-4-5`

## 1. Start the stack

```bash
docker compose up -d --build
```

Expected: `db`, `backend`, `frontend`, `nginx` all healthy. Backend serves on `:3000`, frontend
proxied via NGINX on `:8080`.

## 2. Apply the schema

```bash
docker compose exec backend npx prisma migrate deploy
```

Expected: `anime`, `genre`, `anime_genre` tables created.

## 3. Ingest the catalog from Jikan

```bash
docker compose exec backend npm run ingest:catalog
```

Expected: a few thousand titles + their genres imported (throttled to respect Jikan's rate limit).
Re-running updates existing rows by `malId` (no duplicates).

## 4. Smoke-test the API

```bash
curl localhost:3000/health
curl "localhost:3000/genres" | head
curl "localhost:3000/anime/search?q=naru"
curl -X POST localhost:3000/recommendations \
  -H 'content-type: application/json' \
  -d '{"genreIds":[1,40],"favoriteAnimeIds":[],"includeExplicit":false}'
```

Expected (POST): `{ "results": [ {..., "band": "...", "reason": "..."} ], "aiAssisted": true }`,
at least 10 results, each with a band, no numeric score, no explicit titles.

## 5. Verify in the browser (Playwright + manual)

1. Open `http://localhost:8080`.
2. Select 2–3 genres, optionally search and pick a favorite, submit.
3. Confirm: a ranked list appears within ~5s, grouped/labeled as **Chef's pick / Recommended /
   Worth a try**, each with a short "why", and your named favorite is absent. *(SC-001…SC-006)*

## 6. Verify graceful AI-off degradation (Principle II / SC-007)

Temporarily set an invalid `ANTHROPIC_API_KEY`, restart the backend, and resubmit. Expected: a valid
banded list still returns, `aiAssisted: false`, `reason: null` — the app is not blocked.

## 7. Acceptance mapping

| Spec item | Verified by |
|-----------|-------------|
| US1 (form → ranked list) | Steps 4–5 |
| US2 (AI explanations) | Step 4 (`reason` present) |
| US2 fallback / SC-007 | Step 6 |
| FR-006 anonymous | No login anywhere in steps 1–5 |
| FR-007 exclude favorites | Step 5 |
| FR-015 explicit gate | Step 4 (`includeExplicit:false` excludes explicit) |
| SC-003 dynamic results | Change genres, resubmit, list changes |
