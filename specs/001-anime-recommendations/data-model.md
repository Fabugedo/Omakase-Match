# Phase 1 Data Model: Anime Recommendations

## Persisted entities (PostgreSQL)

Only the catalog is persisted. The MVP is anonymous — Taste Profile and Recommendation are
**transient** (built per request, never stored).

### `anime`

| Field | Type | Notes |
|-------|------|-------|
| `id` | int, PK | Our internal id |
| `malId` | int, unique | MyAnimeList id (from Jikan) — dedupe key for re-ingestion |
| `title` | text | Default (romaji) title |
| `titleEnglish` | text, nullable | English title when available |
| `synopsis` | text, nullable | Short description (truncated for AI input) |
| `imageUrl` | text, nullable | Cover image |
| `popularity` | int, nullable | Jikan popularity rank (lower = more popular) |
| `score` | float, nullable | Jikan mean score (0–10) |
| `members` | int, nullable | Audience size (tiebreak signal) |
| `rating` | enum, nullable | Content rating: `G`, `PG`, `PG13`, `R17`, `RPLUS`, `RX` |
| `isExplicit` | boolean | Derived: `true` when `rating` ∈ {`RPLUS`,`RX`} — drives the 18+ gate |
| `year` | int, nullable | Release year |
| `episodes` | int, nullable | Episode count |
| `createdAt` / `updatedAt` | timestamp | Bookkeeping |

### `genre`

| Field | Type | Notes |
|-------|------|-------|
| `id` | int, PK | Internal id |
| `malId` | int, unique | Jikan genre id |
| `name` | text | e.g. "Action", "Psychological", "Slice of Life" |
| `kind` | enum | `GENRE`, `THEME`, or `DEMOGRAPHIC` (Jikan distinguishes these) |

The taste form offers genres + themes for selection (`kind` in {`GENRE`,`THEME`}).

### `anime_genre` (join — many-to-many)

| Field | Type | Notes |
|-------|------|-------|
| `animeId` | int, FK → anime.id | |
| `genreId` | int, FK → genre.id | |
| PK | (`animeId`, `genreId`) | |

Indexes: `anime(popularity)`, `anime(isExplicit)`, `anime_genre(genreId)`, `anime_genre(animeId)`.

## Transient (request-scoped) shapes

### Taste Profile (request body)
- `genreIds: int[]` — selected genres/themes (≥1 required)
- `favoriteAnimeIds: int[]` — chosen from catalog search (optional)
- `includeExplicit: boolean` — true only after the visitor self-confirms 18+

### Recommendation (response item)
- `id, title, titleEnglish, synopsis, imageUrl, genres: string[]`
- `band: "CHEFS_PICK" | "RECOMMENDED" | "WORTH_A_TRY"`
- `reason: string | null` — AI blurb; `null` when the AI assist is unavailable

## Validation rules (from spec requirements)

- `genreIds` non-empty → else 400 with a clear message (FR-011).
- `includeExplicit=false` (or absent) → exclude `isExplicit=true` titles (FR-015).
- Favorites are always real catalog ids (search-as-you-type, FR-002); excluded from results (FR-007).
- Catalog/AI text sanitized before display (FR-013).

## Deterministic scoring (Stage 1 — pure, unit-tested)

Given `genreIds` (G), the genre-set of favorites (F, union of genres of `favoriteAnimeIds`), and the
explicit flag:

1. **Candidate set**: anime sharing ≥1 genre with `G ∪ F`, excluding favorites, excluding explicit
   unless `includeExplicit`.
2. **Score** per candidate:
   `score = w1 * |genres ∩ G| + w2 * |genres ∩ F| + w3 * normalizedPopularity`
   (start with `w1=3, w2=2, w3=1`; tune later). Normalized popularity in [0,1].
3. **Shortlist**: take the top **25** by score (configurable). If fewer than the target minimum
   exist, return what we have and mark weaker confidence (FR-012).

## Banding (score → label)

- Deterministic default: split the final ordered list into thirds → top = `CHEFS_PICK`,
  middle = `RECOMMENDED`, bottom = `WORTH_A_TRY`.
- When the AI assist runs, it may adjust ordering and assign bands; its output is validated, and if
  invalid/unavailable we fall back to the deterministic banding above (Principle II).
