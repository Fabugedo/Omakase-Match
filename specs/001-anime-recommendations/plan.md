# Implementation Plan: Anime Recommendations

**Branch**: `001-anime-recommendations` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-anime-recommendations/spec.md`

## Summary

An anonymous web app where a visitor selects anime genres/themes and (optionally) searches for
favorite titles, then receives a ranked, dynamic set of anime recommendations drawn from a large
catalog. A **deterministic core** (PostgreSQL catalog + multi-signal scoring) shortlists ~25
candidates; an **AI assist** (a pluggable, backend-only provider — default **Google Gemini free
tier**) both **interprets free-text taste input** into the structured profile and re-ranks the
shortlist / writes a short "why you'll like this" per result. Recommendation strength is shown as
friendly bands — **Chef's pick / Recommended / Worth a try** — never a raw number. The system works
fully **AI-off**: free text falls back to deterministic keyword matching, and a valid banded list
is always returned even when no provider is configured.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22 (backend and frontend)

**Primary Dependencies**:
- Backend: NestJS 11, Prisma 6 (ORM + migrations), a **pluggable AI provider** (default Google Gemini via REST using Node 22's built-in `fetch` — no SDK dependency), `nestjs-zod` + Zod (request/response validation & OpenAPI generation), AJV (validating untrusted external catalog & AI JSON)
- Frontend: React 19 + Vite 6, TypeScript, a typed fetch client generated from the OpenAPI contract; **react-i18next** for UI translations (en/es/pt/fr, English default)
- Data: Jikan v4 REST API (MyAnimeList data, no API key) for catalog ingestion

**Storage**: PostgreSQL 16 (no PostGIS). Tables: `anime`, `genre`, `anime_genre`. No user tables (anonymous MVP — taste profile and recommendations are per-request, never persisted).

**Testing**: Vitest (unit) for the scoring engine; Supertest (integration) for the API; Playwright (browser verification of the end-to-end flow).

**Target Platform**: Linux containers. Frontend deployed to Vercel; backend + PostgreSQL deployed to Railway. Docker Compose for local dev parity (Postgres + backend + frontend + NGINX).

**Project Type**: Web application (separate `backend/` and `frontend/`).

**Performance Goals**: Recommendations returned within ~5s p95 (SC-006); the deterministic shortlist query under ~300ms over a catalog of a few thousand titles.

**Constraints**: Low traffic (learning/demo project). The AI provider key (default Gemini free tier) and DB credentials live only server-side. AI assist operates on a bounded shortlist (~25 items) and on short free-text inputs to keep tokens/cost minimal. Catalog ≈ 2,000–5,000 most-popular SFW titles (plus a flagged explicit set behind the 18+ gate).

**Scale/Scope**: Single feature, ~5 screens/states, one backend service, low concurrency.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | How this plan complies |
|-----------|--------|------------------------|
| I. Spec-Driven Development | ✅ | This plan follows the clarified spec; tasks come next via `/tasks`. |
| II. Deterministic Core, AI as Assist | ✅ | Scoring + shortlist are pure SQL/TypeScript; AI only **interprets free text** into known tags and **re-ranks/explains** the shortlist — never the matching itself. Free text degrades to deterministic keyword matching, and `RecommendationsService` returns a valid banded list with the AI step disabled. All AI output is validated against the real vocabulary/schemas before use. |
| III. Secure by Default | ✅ | AI provider key + DB URL in backend `.env` (gitignored); frontend calls only the NestJS API. External (Jikan) and AI output treated as untrusted, validated with AJV/Zod. Gitleaks before every commit. |
| IV. Contract-First & Fully Validated | ✅ | OpenAPI contract authored in `contracts/openapi.yaml`; Zod schemas mirror it and validate every request/response at runtime; TypeScript end-to-end. |
| V. Right-Sized Simplicity (YAGNI) | ✅ | No accounts, no caching layer, no queue, no PostGIS. One service, three tables, one external API. Prisma chosen for built-in migrations (justified below). |

**Result: PASS.** No violations requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-anime-recommendations/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions & rationale
├── data-model.md        # Phase 1 — entities, fields, scoring
├── quickstart.md        # Phase 1 — run & validate locally
├── contracts/
│   └── openapi.yaml     # Phase 1 — REST contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 — created by /speckit-tasks (NOT here)
```

### Source Code (repository root)

```text
backend/                         # NestJS + TypeScript
├── src/
│   ├── catalog/                 # anime + genres domain
│   │   ├── catalog.controller.ts   # GET /genres, GET /anime/search
│   │   ├── catalog.service.ts
│   │   └── ingestion/              # Jikan import job (CLI/script)
│   │       └── jikan.client.ts
│   ├── recommendations/         # the feature core
│   │   ├── recommendations.controller.ts  # POST /recommendations
│   │   ├── recommendations.service.ts      # orchestration
│   │   ├── scoring.ts                       # deterministic shortlist (pure, unit-tested)
│   │   └── banding.ts                       # score → Chef's pick / Recommended / Worth a try
│   ├── interpret/               # free-text taste → structured profile (US4)
│   │   ├── interpret.controller.ts          # POST /interpret
│   │   └── interpret.service.ts             # AI provider OR deterministic keyword fallback
│   ├── ai/                      # pluggable AI provider client (the ONLY place the key is used)
│   │   └── gemini.client.ts                 # default provider; swappable via env
│   ├── common/                  # Zod schemas, config, AJV validators, health
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── test/                        # unit + integration

frontend/                        # React + Vite + TypeScript
├── src/
│   ├── features/
│   │   ├── landing/             # nav, hero, how-it-works, catalog strip, footer
│   │   ├── taste-form/          # conversational free-text box (primary) + genre/favorite refiner
│   │   └── recommendations/     # banded results + blurbs
│   ├── api/                     # typed client generated from contracts/openapi.yaml
│   └── main.tsx
└── e2e/                         # Playwright specs

docker-compose.yml               # postgres + backend + frontend + nginx
nginx/nginx.conf
.env.example                     # already present at repo root; backend reads its own .env
```

**Structure Decision**: Web-application layout (Option 2) — the spec defines a browser UI plus a
service with a database, and the constitution locks React + NestJS. Code is organized **by
business capability** (`catalog`, `recommendations`, `interpret`, `ai`) rather than technical
layers, per the constitution. The AI integration is isolated to a single provider client so the
secret never leaks and the deterministic fallback (keyword matching + threshold banding) is easy
to enforce and test.

## Complexity Tracking

> No Constitution Check violations. One dependency choice worth recording:

| Choice | Why Needed | Simpler Alternative Rejected Because |
|--------|------------|-------------------------------------|
| Prisma ORM | Type-safe DB access + first-class migrations for the catalog schema | Raw SQL / `pg` would require hand-rolled migrations and lose end-to-end types (violates Principle IV's "typed boundaries"); acceptable but more error-prone for a learner. |
