import type { Band } from '../common/schemas';

/**
 * Banding (T019). PURE. Turns a ranked position into a friendly band — never a
 * raw score is shown to the visitor (spec rule). The deterministic default
 * splits the ordered shortlist into thirds: top → Chef's pick, middle →
 * Recommended, bottom → Worth a try. When the AI assist runs (US2) it may assign
 * its own bands; if it's unavailable or invalid we fall back to exactly this.
 */

/**
 * Band for one position in an ordered list of `total` items (index 0 = best).
 * Uses thirds; with small lists the top third fills first so a 1-item list is a
 * Chef's pick.
 */
export function bandForPosition(index: number, total: number): Band {
  if (total <= 0 || index < 0) return 'WORTH_A_TRY';
  const third = total / 3;
  if (index < third) return 'CHEFS_PICK';
  if (index < 2 * third) return 'RECOMMENDED';
  return 'WORTH_A_TRY';
}

/** Bands for every position in an ordered list of length `total`. */
export function bandByThirds(total: number): Band[] {
  return Array.from({ length: Math.max(0, total) }, (_, i) => bandForPosition(i, total));
}
