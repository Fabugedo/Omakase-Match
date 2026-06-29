import { describe, it, expect } from 'vitest';
import {
  buildShortlist,
  WEIGHTS,
  type ScoringCandidate,
  type TasteInput,
} from '../src/recommendations/scoring';
import { bandByThirds, bandForPosition } from '../src/recommendations/banding';

/** Build a candidate with sensible defaults; override only what a test cares about. */
function candidate(over: Partial<ScoringCandidate> & { id: number }): ScoringCandidate {
  return { genreIds: [], popularity: null, isExplicit: false, ...over };
}

/** Build a taste profile with empty defaults. */
function taste(over: Partial<TasteInput> = {}): TasteInput {
  return {
    selectedGenreIds: [],
    favoriteAnimeIds: [],
    favoriteGenreIds: [],
    includeExplicit: false,
    ...over,
  };
}

describe('buildShortlist — eligibility', () => {
  it('excludes candidates that share no genre with G ∪ F', () => {
    const candidates = [
      candidate({ id: 1, genreIds: [1] }), // matches selected
      candidate({ id: 2, genreIds: [99] }), // shares nothing
    ];
    const result = buildShortlist(candidates, taste({ selectedGenreIds: [1] }));
    expect(result.map((r) => r.id)).toEqual([1]);
  });

  it('excludes the visitor’s own favorites from the results', () => {
    const candidates = [candidate({ id: 1, genreIds: [1] }), candidate({ id: 2, genreIds: [1] })];
    const result = buildShortlist(
      candidates,
      taste({ selectedGenreIds: [1], favoriteAnimeIds: [1] }),
    );
    expect(result.map((r) => r.id)).toEqual([2]);
  });

  it('excludes explicit titles unless includeExplicit is true', () => {
    const candidates = [candidate({ id: 1, genreIds: [1], isExplicit: true })];
    expect(buildShortlist(candidates, taste({ selectedGenreIds: [1] }))).toHaveLength(0);
    expect(
      buildShortlist(candidates, taste({ selectedGenreIds: [1], includeExplicit: true })),
    ).toHaveLength(1);
  });

  it('returns nothing when no genres are selected and no favorites given', () => {
    const candidates = [candidate({ id: 1, genreIds: [1] })];
    expect(buildShortlist(candidates, taste())).toHaveLength(0);
  });
});

describe('buildShortlist — scoring', () => {
  it('applies the documented weights: 3·genre + 2·favorite + 1·normalizedPopularity', () => {
    // Single eligible candidate -> normalizedPopularity is 1 (no spread).
    const candidates = [candidate({ id: 1, genreIds: [1, 2], popularity: 100 })];
    const result = buildShortlist(
      candidates,
      taste({ selectedGenreIds: [1, 2], favoriteGenreIds: [2] }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      genreOverlap: 2,
      favoriteOverlap: 1,
      normalizedPopularity: 1,
    });
    // 3*2 + 2*1 + 1*1 = 9
    expect(result[0].score).toBe(WEIGHTS.genre * 2 + WEIGHTS.favorite * 1 + WEIGHTS.popularity * 1);
  });

  it('ranks more genre overlap above less', () => {
    const candidates = [
      candidate({ id: 1, genreIds: [1] }),
      candidate({ id: 2, genreIds: [1, 2] }),
    ];
    const result = buildShortlist(candidates, taste({ selectedGenreIds: [1, 2] }));
    expect(result.map((r) => r.id)).toEqual([2, 1]);
  });

  it('counts favorite-genre overlap (weight 2) toward the score', () => {
    const candidates = [
      candidate({ id: 1, genreIds: [1] }), // selected only
      candidate({ id: 2, genreIds: [1, 5] }), // selected + a favorite genre
    ];
    const result = buildShortlist(
      candidates,
      taste({ selectedGenreIds: [1], favoriteGenreIds: [5] }),
    );
    expect(result.map((r) => r.id)).toEqual([2, 1]);
    expect(result.find((r) => r.id === 2)?.favoriteOverlap).toBe(1);
  });

  it('uses normalized popularity only as a tiebreaker (more popular = lower rank wins)', () => {
    const candidates = [
      candidate({ id: 1, genreIds: [1], popularity: 500 }), // less popular
      candidate({ id: 2, genreIds: [1], popularity: 10 }), // more popular
    ];
    const result = buildShortlist(candidates, taste({ selectedGenreIds: [1] }));
    expect(result.map((r) => r.id)).toEqual([2, 1]);
  });

  it('is deterministic: full ties break by id ascending', () => {
    const candidates = [
      candidate({ id: 3, genreIds: [1] }),
      candidate({ id: 1, genreIds: [1] }),
      candidate({ id: 2, genreIds: [1] }),
    ];
    const result = buildShortlist(candidates, taste({ selectedGenreIds: [1] }));
    expect(result.map((r) => r.id)).toEqual([1, 2, 3]);
  });

  it('caps the shortlist at the requested size', () => {
    const candidates = Array.from({ length: 10 }, (_, i) =>
      candidate({ id: i + 1, genreIds: [1] }),
    );
    expect(buildShortlist(candidates, taste({ selectedGenreIds: [1] }), 3)).toHaveLength(3);
  });
});

describe('bandByThirds / bandForPosition', () => {
  it('splits an ordered list into thirds', () => {
    const bands = bandByThirds(9);
    expect(bands).toEqual([
      'CHEFS_PICK',
      'CHEFS_PICK',
      'CHEFS_PICK',
      'RECOMMENDED',
      'RECOMMENDED',
      'RECOMMENDED',
      'WORTH_A_TRY',
      'WORTH_A_TRY',
      'WORTH_A_TRY',
    ]);
  });

  it('always opens with Chef’s pick and closes with Worth a try for a full list', () => {
    const bands = bandByThirds(25);
    expect(bands[0]).toBe('CHEFS_PICK');
    expect(bands[bands.length - 1]).toBe('WORTH_A_TRY');
    expect(bands).toHaveLength(25);
  });

  it('handles tiny and empty lists', () => {
    expect(bandByThirds(0)).toEqual([]);
    expect(bandByThirds(1)).toEqual(['CHEFS_PICK']);
    expect(bandByThirds(3)).toEqual(['CHEFS_PICK', 'RECOMMENDED', 'WORTH_A_TRY']);
    expect(bandForPosition(0, 0)).toBe('WORTH_A_TRY'); // guard
  });
});
