# Phase 0 Research: Anime Recommendations

All decisions below were resolved during planning; there are **no remaining NEEDS CLARIFICATION**.

## Decision: Anime data source — Jikan v4 (MyAnimeList)

- **Decision**: Use the **Jikan v4 REST API** (`https://api.jikan.moe/v4`) as the catalog source.
- **Rationale**: No API key, well-documented, returns genres/themes, synopsis, images, popularity,
  score, and a content `rating` field (needed for the 18+ gate). REST + JSON is simple to validate
  with AJV. Aligns with the constitution's "public anime API, not scraping".
- **Alternatives considered**: **AniList** (GraphQL — richer, but more complex client and schema for
  a first project); **web scraping** (rejected by the constitution — fragile, ToS risk).
- **Constraint**: Jikan is rate-limited (~3 req/s, ~60/min). Mitigation: ingestion is a one-time /
  periodic batch job with throttling, not a per-user call.

## Decision: Catalog ingestion — pre-load into our PostgreSQL, not live queries

- **Decision**: A batch **ingestion job** pulls the most-popular ~2,000–5,000 titles (plus their
  genres) from Jikan into our own `anime`/`genre`/`anime_genre` tables. Recommendations query our DB.
- **Rationale**: Directly addresses the user's "didn't feel dynamic / wanted real tables" concern —
  we own a real relational catalog, can run rich multi-signal scoring fast, and avoid per-request
  rate limits and latency. Re-runnable to refresh data.
- **Alternatives considered**: Query Jikan live per request (rejected: slow, rate-limited, no rich
  cross-title scoring, fragile if Jikan is down mid-request).

## Decision: Two-stage matching — deterministic shortlist → AI re-rank

- **Decision**: Stage 1 (deterministic) scores the whole catalog and selects the top ~25 candidates.
  Stage 2 (AI) re-ranks those ~25 and writes a one-line reason each.
- **Rationale**: This "retrieve-then-rerank" pattern keeps AI token usage bounded and constant
  regardless of catalog size (solves the "full-AI doesn't scale" problem), while letting the AI add
  nuance. Honors Constitution Principle II: the system produces a valid banded list with Stage 2 off.
- **Scoring signals (Stage 1)**: genre/theme overlap with selected tags; overlap with the genres of
  named favorites; popularity/score as a tiebreaker. Favorites and (unless 18+ confirmed) explicit
  titles are excluded. Details in `data-model.md`.

## Decision: AI model — Claude Haiku 4.5

- **Decision**: `claude-haiku-4-5` via `@anthropic-ai/sdk`, called only from the backend `ai` module.
- **Rationale**: Cheapest current model ($1/$5 per 1M tokens) and fast; the task (re-rank ~25 short
  items + brief blurbs) is small and well within its ability. Matches the cost-conscious, low-traffic
  goal. Model id is read from an env var so it can be changed without code edits.
- **Integration**: Use **structured outputs** (`output_config.format` with a JSON schema) so the
  re-rank returns a strict, parseable ordering + reason + band — no fragile text parsing. Input is a
  compact list of the ~25 candidates + the visitor's taste. AI output is validated (Zod) before use;
  on any error/timeout the service falls back to the deterministic ordering and omits reasons.
- **Alternatives considered**: Sonnet 4.6 / Opus 4.8 — more capable but unnecessary and 3–5× the cost.

## Decision: Validation — Zod (boundaries) + AJV (external data)

- **Decision**: `nestjs-zod` + Zod validate every API request/response and generate the OpenAPI doc;
  AJV validates raw Jikan JSON during ingestion (untrusted external input).
- **Rationale**: Satisfies Constitution Principle IV (OpenAPI-first, everything validated) using the
  exact tools the constitution locked (Zod + AJV). Keeps the contract and runtime checks in sync.

## Decision: Frontend tooling — React + Vite

- **Decision**: React 19 + Vite 6 + TypeScript; a typed API client generated from `openapi.yaml`.
- **Rationale**: Vite is fast and simple; generating the client from the contract keeps frontend and
  backend honest (Principle IV). Not mobile-first (per constitution); React Native is a later feature.

## Decision: Hosting — Vercel (frontend) + Railway (backend + Postgres)

- **Decision**: Frontend on Vercel (free), NestJS + PostgreSQL on Railway (hobby tier).
- **Rationale**: Settles the constitution's open hosting question. Vercel suits static/SPA React;
  Railway runs a long-lived Node server + managed Postgres with minimal setup. Docker Compose mirrors
  this locally. The Claude key is a Railway env var, never in the frontend.
- **Note for the user**: deployment will be walked through step-by-step in a later phase; nothing to
  configure during local development.
