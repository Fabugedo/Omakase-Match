import 'dotenv/config';
import { ContentRating, GenreKind, PrismaClient } from '@prisma/client';
import { JikanClient } from './jikan.client';
import type { JikanAnime, JikanTag } from './jikan.schema';

/**
 * Catalog ingestion job (T013). Pages the most-popular anime from Jikan, upserts
 * them (dedup by malId), derives the explicit flag, and imports their genres /
 * themes / demographics with join rows. Bounded to the top ~3,000 titles to keep
 * ingestion time reasonable.
 *
 * Run with: npm run ingest:catalog
 */

const TARGET_COUNT = Number(process.env.INGEST_LIMIT ?? 3000);
const PAGE_SIZE = 25; // Jikan returns 25 items per page

/** Map a Jikan rating string (e.g. "R - 17+ (violence & profanity)") to our enum. */
export function mapRating(raw: string | null | undefined): ContentRating | null {
  if (!raw) return null;
  const r = raw.trim().toLowerCase();
  if (r.startsWith('pg-13')) return ContentRating.PG13;
  if (r.startsWith('pg')) return ContentRating.PG;
  if (r.startsWith('g')) return ContentRating.G;
  if (r.startsWith('r+')) return ContentRating.RPLUS;
  if (r.startsWith('rx')) return ContentRating.RX;
  if (r.startsWith('r')) return ContentRating.R17; // "R - 17+"
  return null;
}

const EXPLICIT_RATINGS = new Set<ContentRating>([ContentRating.RPLUS, ContentRating.RX]);

interface TaggedGenre extends JikanTag {
  kind: GenreKind;
}

/** Flatten an anime's three tag arrays into a single list carrying GenreKind. */
function collectGenres(anime: JikanAnime): TaggedGenre[] {
  const out: TaggedGenre[] = [];
  for (const g of anime.genres ?? []) out.push({ ...g, kind: GenreKind.GENRE });
  for (const t of anime.themes ?? []) out.push({ ...t, kind: GenreKind.THEME });
  for (const d of anime.demographics ?? []) out.push({ ...d, kind: GenreKind.DEMOGRAPHIC });
  return out;
}

async function ingest(): Promise<void> {
  const prisma = new PrismaClient();
  const jikan = new JikanClient();
  // Cache genre malId -> our internal id so we upsert each genre only once.
  const genreIdByMalId = new Map<number, number>();
  let imported = 0;
  let page = 1;

  try {
    const totalPages = Math.ceil(TARGET_COUNT / PAGE_SIZE);
    console.log(`Ingesting up to ${TARGET_COUNT} titles (~${totalPages} pages)...`);

    while (imported < TARGET_COUNT) {
      const res = await jikan.getTopAnime(page);
      if (res.data.length === 0) break;

      for (const anime of res.data) {
        if (imported >= TARGET_COUNT) break;

        const rating = mapRating(anime.rating);
        const saved = await prisma.anime.upsert({
          where: { malId: anime.mal_id },
          create: {
            malId: anime.mal_id,
            title: anime.title,
            titleEnglish: anime.title_english ?? null,
            synopsis: anime.synopsis ?? null,
            imageUrl: anime.images?.jpg?.image_url ?? null,
            popularity: anime.popularity ?? null,
            score: anime.score ?? null,
            members: anime.members ?? null,
            rating,
            isExplicit: rating !== null && EXPLICIT_RATINGS.has(rating),
            year: anime.year ?? null,
            episodes: anime.episodes ?? null,
          },
          update: {
            title: anime.title,
            titleEnglish: anime.title_english ?? null,
            synopsis: anime.synopsis ?? null,
            imageUrl: anime.images?.jpg?.image_url ?? null,
            popularity: anime.popularity ?? null,
            score: anime.score ?? null,
            members: anime.members ?? null,
            rating,
            isExplicit: rating !== null && EXPLICIT_RATINGS.has(rating),
            year: anime.year ?? null,
            episodes: anime.episodes ?? null,
          },
        });

        // Upsert this title's genres (cache by malId) and rebuild its join rows.
        const tags = collectGenres(anime);
        for (const tag of tags) {
          if (!genreIdByMalId.has(tag.mal_id)) {
            const genre = await prisma.genre.upsert({
              where: { malId: tag.mal_id },
              create: { malId: tag.mal_id, name: tag.name, kind: tag.kind },
              update: { name: tag.name, kind: tag.kind },
            });
            genreIdByMalId.set(tag.mal_id, genre.id);
          }
        }

        await prisma.animeGenre.deleteMany({ where: { animeId: saved.id } });
        if (tags.length > 0) {
          await prisma.animeGenre.createMany({
            data: tags.map((tag) => ({
              animeId: saved.id,
              genreId: genreIdByMalId.get(tag.mal_id) as number,
            })),
            skipDuplicates: true,
          });
        }

        imported += 1;
      }

      console.log(`  page ${page}: ${imported}/${TARGET_COUNT} titles`);
      if (!res.pagination?.has_next_page) break;
      page += 1;
    }

    const genreCount = await prisma.genre.count();
    console.log(`Done. ${imported} anime, ${genreCount} genres in the catalog.`);
  } finally {
    await prisma.$disconnect();
  }
}

ingest().catch((err: unknown) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
