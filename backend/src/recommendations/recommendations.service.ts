import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import type { Recommendation, RecommendationsResponse, TasteProfile } from '../common/schemas';
import { buildShortlist, type ScoringCandidate } from './scoring';
import { bandByThirds } from './banding';

/**
 * Orchestrates a recommendation request (T021). Deterministic only — no AI yet
 * (US2 wraps this). Flow: derive the favorites' genres → pull a candidate pool
 * from the DB → score + rank (scoring.ts) → band (banding.ts) → shape the result.
 *
 * Scale decision lives here: the genre-overlap filter runs in SQL (the big
 * reducer, ~3,000 rows → a few hundred), then the PURE scoring re-applies all
 * rules and ranks in memory. At much larger catalogs the scoring would move into
 * SQL too; the scoring module would stay the source of truth for the math.
 */
@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(profile: TasteProfile): Promise<RecommendationsResponse> {
    const { genreIds, favoriteAnimeIds, includeExplicit } = profile;

    // F — the union of the genres of the visitor's favorite titles.
    const favoriteGenreIds = favoriteAnimeIds.length
      ? [
          ...new Set(
            (
              await this.prisma.animeGenre.findMany({
                where: { animeId: { in: favoriteAnimeIds } },
                select: { genreId: true },
              })
            ).map((row) => row.genreId),
          ),
        ]
      : [];

    // Candidate pool: anything sharing at least one genre with G ∪ F (SQL prefilter).
    const union = [...new Set([...genreIds, ...favoriteGenreIds])];
    const candidates = await this.prisma.anime.findMany({
      where: { genres: { some: { genreId: { in: union } } } },
      include: { genres: { include: { genre: true } } },
    });

    // Rank with the pure core (it owns the favorite/explicit/eligibility rules).
    const scoringCandidates: ScoringCandidate[] = candidates.map((a) => ({
      id: a.id,
      genreIds: a.genres.map((g) => g.genreId),
      popularity: a.popularity,
      isExplicit: a.isExplicit,
    }));
    const shortlist = buildShortlist(scoringCandidates, {
      selectedGenreIds: genreIds,
      favoriteAnimeIds,
      favoriteGenreIds,
      includeExplicit,
    });

    // Band by position, then shape into the response contract.
    const bands = bandByThirds(shortlist.length);
    const byId = new Map(candidates.map((a) => [a.id, a]));
    const results: Recommendation[] = shortlist.map((scored, index) => {
      const anime = byId.get(scored.id)!;
      return {
        id: anime.id,
        title: anime.title,
        titleEnglish: anime.titleEnglish,
        synopsis: anime.synopsis,
        imageUrl: anime.imageUrl,
        genres: anime.genres.map((g) => g.genre.name),
        band: bands[index],
        reason: null, // populated by the AI assist in US2
      };
    });

    return { results, aiAssisted: false };
  }
}
