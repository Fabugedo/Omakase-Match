import { Injectable } from '@nestjs/common';
import { GenreKind } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import type { AnimeSummary, Genre } from '../common/schemas';

const SEARCH_LIMIT = 10;

/**
 * Read access to the catalog (T016, T017): the selectable genres for the taste
 * form and title search for favorite autocomplete.
 */
@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /** Genres + themes offered for selection (demographics are not user-selectable). */
  async getGenres(): Promise<Genre[]> {
    const rows = await this.prisma.genre.findMany({
      where: { kind: { in: [GenreKind.GENRE, GenreKind.THEME] } },
      orderBy: { name: 'asc' },
    });
    return rows.map((g) => ({ id: g.id, name: g.name, kind: g.kind }));
  }

  /** Title search for picking favorites; most-popular matches first, capped. */
  async searchAnime(q: string): Promise<AnimeSummary[]> {
    const rows = await this.prisma.anime.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { titleEnglish: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { popularity: 'asc' }, // lower rank = more popular; nulls sort last
      take: SEARCH_LIMIT,
    });
    return rows.map((a) => ({ id: a.id, title: a.title, imageUrl: a.imageUrl }));
  }
}
