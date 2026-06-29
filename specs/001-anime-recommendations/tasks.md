# Tasks: Anime Recommendations

**Input**: Design documents from `specs/001-anime-recommendations/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: A focused set of tests is included (the deterministic scoring core, the recommendations
endpoint, the AI-off fallback, and one end-to-end browser check) — these directly back the spec's
Success Criteria and the constitution's "verify before claiming done". Full TDD is not required.

**Organization**: Tasks are grouped by user story so each story is an independently testable
increment. US1 alone is a working, shippable MVP (no AI needed).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 (setup, foundational, and polish tasks have no story label)
- Paths follow the web-app layout in plan.md (`backend/`, `frontend/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project skeleton both halves build on.

- [X] T001 Create monorepo folders `backend/` and `frontend/` per plan.md structure
- [X] T002 Initialize NestJS + TypeScript app in `backend/` (TypeScript pinned to 5.x), Node 22, with `package.json` scripts (`start:dev`, `build`, `start`)
- [X] T003 [P] Initialize React + Vite + TypeScript app in `frontend/`
- [X] T003a [P] Set up i18n in `frontend/` (react-i18next) with `en`/`es`/`pt`/`fr` locale files, English default; enforce **no hardcoded UI strings** (all copy via i18n keys) (FR-016)
- [X] T004 [P] Add `docker-compose.yml` (services: `db` Postgres 16, `backend`, `frontend`, `nginx`) and `nginx/nginx.conf` reverse-proxy config
- [X] T005 [P] Configure ESLint + Prettier in `backend/` and `frontend/`
- [X] T006 Create `backend/.env.example` (DATABASE_URL, ANTHROPIC_API_KEY, ANTHROPIC_MODEL=claude-haiku-4-5, PORT) and confirm `backend/.env` is gitignored
- [X] T007 [P] Add `backend/src/common/config` module that loads & validates env vars with Zod at startup

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The catalog and shared plumbing. **⚠️ No user story can be built until this is done** — recommendations need a populated catalog.

- [X] T008 Add Prisma to `backend/`; define `backend/prisma/schema.prisma` with `Anime`, `Genre`, `AnimeGenre` models + enums (`GenreKind`, `ContentRating`) per data-model.md
- [X] T009 Generate the initial Prisma migration and a `PrismaService` in `backend/src/common/prisma.service.ts`
- [X] T010 [P] Define shared Zod schemas mirroring `contracts/openapi.yaml` in `backend/src/common/schemas.ts` (TasteProfile, Recommendation, Genre, AnimeSummary, Error)
- [X] T011 [P] Add AJV validators for raw Jikan responses in `backend/src/catalog/ingestion/jikan.schema.ts` (untrusted external input)
- [X] T012 Implement Jikan client + throttling in `backend/src/catalog/ingestion/jikan.client.ts`
- [X] T013 Implement catalog ingestion job `backend/src/catalog/ingestion/ingest.ts` + npm script `ingest:catalog` (upsert by `malId`, derive `isExplicit`, import genres + join rows; **cap at the top ~3,000 titles by popularity** to bound ingestion time)
- [X] T014 [P] Add global error handling + a `GET /health` endpoint in `backend/src/common/`
- [X] T015 Wire `nestjs-zod` so request/response DTOs validate at runtime and feed OpenAPI generation

**Checkpoint**: `docker compose up` → migrate → `npm run ingest:catalog` populates a real catalog. Foundation ready.

---

## Phase 3: User Story 1 — Recommendations from a taste form (Priority: P1) 🎯 MVP

**Goal**: Visitor picks genres + optional favorites, submits, gets a ranked, banded list — **fully deterministic, no AI**.

**Independent Test**: With AI absent, submit a taste profile and receive ≥10 banded results (Chef's pick / Recommended / Worth a try), favorites excluded, explicit excluded unless 18+ confirmed.

### Backend
- [X] T016 [P] [US1] Implement `GET /genres` (controller + `catalog.service.getGenres`) in `backend/src/catalog/`
- [X] T017 [P] [US1] Implement `GET /anime/search?q=` (autocomplete) in `backend/src/catalog/`
- [X] T018 [P] [US1] Implement pure scoring in `backend/src/recommendations/scoring.ts` (candidate set + weighted score + top-25 shortlist per data-model.md)
- [X] T019 [P] [US1] Implement banding in `backend/src/recommendations/banding.ts` (score → CHEFS_PICK / RECOMMENDED / WORTH_A_TRY)
- [X] T020 [US1] Unit test the scoring + banding in `backend/test/scoring.spec.ts` (Vitest) — covers genre overlap, favorite similarity, exclusions, thresholds
- [X] T021 [US1] Implement `recommendations.service.ts` (deterministic only: shortlist → band → return `aiAssisted:false`) in `backend/src/recommendations/`
- [X] T022 [US1] Implement `POST /recommendations` controller with Zod validation (empty genres → 400) in `backend/src/recommendations/`
- [X] T023 [US1] Integration test `POST /recommendations` in `backend/test/recommendations.e2e-spec.ts` (Supertest): ≥10 results, no explicit, favorite excluded, 400 on empty

### Frontend
- [X] T024 [P] [US1] Generate typed API client from `contracts/openapi.yaml` into `frontend/src/api/`
- [X] T025 [US1] Build the taste form (`frontend/src/features/taste-form/`): genre/theme multi-select from `GET /genres`, favorite search-as-you-type via `GET /anime/search`, an 18+ self-confirm toggle, and a language switcher (EN/ES/PT/FR) — all copy via i18n keys (FR-016)
- [X] T026 [US1] Build the results view (`frontend/src/features/recommendations/`): grouped/labeled bands, title/image/synopsis/genres; **render all external/AI text as plain text (never `dangerouslySetInnerHTML`)** (FR-013); explicit **empty / "not enough matches" / weak-confidence** states (FR-012)
- [X] T027 [US1] Wire submit → `POST /recommendations` → render; loading + error states

**Checkpoint**: MVP works end-to-end with no AI. Demoable.

---

## Phase 4: User Story 2 — AI explanations + re-rank (Priority: P2)

**Goal**: For each result, Claude re-ranks the shortlist and writes a short "why"; system still works if AI is down.

**Independent Test**: With a valid key, each result has a relevant `reason` and `aiAssisted:true`; with an invalid key, list still returns, `aiAssisted:false`, `reason:null`.

- [ ] T028 [US2] Implement `ai/reranker.service.ts` in `backend/src/ai/` — Anthropic SDK, `ANTHROPIC_MODEL` (Haiku 4.5), structured outputs (JSON schema) returning ordered ids + band + reason for the ~25 shortlist, **with each reason written in the visitor's selected language (EN/ES/PT/FR)** (FR-016)
- [ ] T029 [US2] Validate AI output with Zod; on any error/timeout fall back to deterministic order/bands (Principle II) — in `recommendations.service.ts`
- [ ] T030 [US2] Integrate reranker into `recommendations.service.ts`: shortlist → AI rerank → set `reason` + `aiAssisted:true`
- [ ] T031 [US2] Integration test for AI-off fallback in `backend/test/recommendations.e2e-spec.ts` (mock failure → `aiAssisted:false`, valid list)
- [ ] T032 [US2] Frontend: render the `reason` blurb per result; hide gracefully when null

**Checkpoint**: US1 + US2 both work; AI degrades safely.

---

## Phase 5: User Story 3 — Refine taste & regenerate (Priority: P3)

**Goal**: Visitor edits selections/favorites and regenerates without starting over.

**Independent Test**: Change a genre, resubmit, results update (≥30% change per SC-003).

- [ ] T033 [US3] Persist form state in the results view and add an "edit / regenerate" affordance in `frontend/src/features/`
- [ ] T034 [US3] Ensure resubmit reuses the same flow and visibly updates results (no full reload)

**Checkpoint**: All three stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T035 [P] Playwright e2e covering the full flow + AI-off path in `frontend/e2e/recommendations.spec.ts` (runs the quickstart.md scenarios)
- [ ] T036 [P] Backend hardening: Helmet, CORS (allow only frontend origin), basic rate limit on `POST /recommendations`
- [ ] T037 [P] GitHub Actions CI (`.github/workflows/ci.yml`): install, lint, typecheck, test, build (backend + frontend) — constitution requires GitHub Actions
- [ ] T037a [P] Generate/curate the `es`/`pt`/`fr` locale files (AI-assisted) from `en`, and verify the UI renders correctly in each language (FR-016)
- [ ] T038 [P] Root `README.md`: what it is, local run (link quickstart.md), env vars (no secrets)
- [ ] T039 Run `quickstart.md` end-to-end and confirm all acceptance rows pass

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** → **Phase 2 (Foundational)** must finish before any user story.
- **US1 (P1)** depends only on Phase 2 → this is the MVP; build it first.
- **US2 (P2)** depends on US1's `recommendations.service` (it wraps the deterministic core with AI).
- **US3 (P3)** depends on US1's frontend (edits the form/results flow).
- **Polish (Phase 6)** after the stories you want to ship.

### Within US1
Scoring/banding (T018–T020) before the service (T021) before the endpoint (T022) before the integration test (T023). Frontend client (T024) before UI (T025–T027).

### Parallel opportunities
- Setup: T003, T004, T005 in parallel.
- Foundational: T010, T011, T014 in parallel.
- US1: T016, T017, T018, T019 are different files → parallel; T024 (client) parallel with backend work.

---

## Implementation Strategy

**MVP first**: Phase 1 → Phase 2 → Phase 3 (US1) → **stop & validate** (deterministic recommender works, demoable) → then layer US2 (AI), US3 (refine), and Polish. Commit after each task or logical group, secret-scan before every commit.

**Total: 41 tasks** — Setup 8 · Foundational 8 · US1 12 · US2 5 · US3 2 · Polish 6. *(i18n folded in 2026-06-28: T003a, T037a, + language in T025/T028.)*
