/**
 * Deterministic scoring core (T018). PURE — no database, no AI, no I/O. It takes
 * a pool of candidate anime plus the visitor's taste and returns a ranked, capped
 * shortlist. Keeping it pure is deliberate: it's the easiest part of the app to
 * unit-test exhaustively (see test/scoring.spec.ts), and the AI step (US2) only
 * ever re-orders what this produces — so the system always works AI-off.
 *
 * Scale note: filtering candidates here happens in memory. For a few thousand
 * titles that's instant. At catalog sizes where it wouldn't be, the eligibility
 * filter (shares a genre, not explicit) moves into the SQL query that feeds this
 * function — the scoring math stays identical. The service decides how big a pool
 * to hand us; this module stays the single source of truth for correctness.
 */

/** The minimal shape scoring needs about one anime. The service maps DB rows to this. */
export interface ScoringCandidate {
  id: number;
  genreIds: number[];
  /** Jikan popularity rank: LOWER means MORE popular. Null when unknown. */
  popularity: number | null;
  isExplicit: boolean;
}

export interface TasteInput {
  /** G — genres/themes the visitor selected. */
  selectedGenreIds: number[];
  /** Catalog ids the visitor marked as favorites; always excluded from results. */
  favoriteAnimeIds: number[];
  /** F — the union of the genres of those favorites. */
  favoriteGenreIds: number[];
  /** Only true after the visitor self-confirms 18+. */
  includeExplicit: boolean;
}

export interface ScoredCandidate {
  id: number;
  score: number;
  genreOverlap: number;
  favoriteOverlap: number;
  normalizedPopularity: number;
}

/** Signal weights. Exported so they can be tuned without touching the logic. */
export const WEIGHTS = { genre: 3, favorite: 2, popularity: 1 } as const;

export const DEFAULT_SHORTLIST_SIZE = 25;

/** Count how many of `ids` are present in `set`. */
function overlapCount(ids: number[], set: Set<number>): number {
  let n = 0;
  for (const id of ids) if (set.has(id)) n += 1;
  return n;
}

/**
 * Score + rank candidates and return the top `shortlistSize`.
 *
 * A candidate is eligible when it shares at least one genre with G ∪ F, is not a
 * favorite, and is not explicit unless `includeExplicit`. Popularity is normalized
 * to [0,1] across the eligible set (most popular → 1) so it only breaks ties.
 */
export function buildShortlist(
  candidates: ScoringCandidate[],
  taste: TasteInput,
  shortlistSize: number = DEFAULT_SHORTLIST_SIZE,
): ScoredCandidate[] {
  const selected = new Set(taste.selectedGenreIds);
  const favoriteGenres = new Set(taste.favoriteGenreIds);
  const favoriteAnime = new Set(taste.favoriteAnimeIds);

  // 1. Eligible candidates: share a genre with G ∪ F, not a favorite, explicit-gated.
  const eligible = candidates.filter((c) => {
    if (favoriteAnime.has(c.id)) return false;
    if (c.isExplicit && !taste.includeExplicit) return false;
    const sharesGenre =
      overlapCount(c.genreIds, selected) > 0 || overlapCount(c.genreIds, favoriteGenres) > 0;
    return sharesGenre;
  });

  // 2. Normalize popularity across the eligible set (rank -> [0,1], higher = more popular).
  const ranks = eligible
    .map((c) => c.popularity)
    .filter((p): p is number => p !== null && Number.isFinite(p));
  const minRank = ranks.length ? Math.min(...ranks) : 0;
  const maxRank = ranks.length ? Math.max(...ranks) : 0;
  const normalizePopularity = (rank: number | null): number => {
    if (rank === null || !Number.isFinite(rank)) return 0; // unknown popularity = weakest
    if (maxRank === minRank) return 1; // all equally popular among known ranks
    return (maxRank - rank) / (maxRank - minRank);
  };

  // 3. Score each eligible candidate.
  const scored: ScoredCandidate[] = eligible.map((c) => {
    const genreOverlap = overlapCount(c.genreIds, selected);
    const favoriteOverlap = overlapCount(c.genreIds, favoriteGenres);
    const normalizedPopularity = normalizePopularity(c.popularity);
    const score =
      WEIGHTS.genre * genreOverlap +
      WEIGHTS.favorite * favoriteOverlap +
      WEIGHTS.popularity * normalizedPopularity;
    return { id: c.id, score, genreOverlap, favoriteOverlap, normalizedPopularity };
  });

  // 4. Rank. Total ordering for determinism: score, then popularity, then id.
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.normalizedPopularity !== a.normalizedPopularity) {
      return b.normalizedPopularity - a.normalizedPopularity;
    }
    return a.id - b.id;
  });

  // 5. Cap at the shortlist size (fewer is fine — the caller flags weak confidence).
  return scored.slice(0, shortlistSize);
}
