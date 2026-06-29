import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { AnimeSummaryDto, GenreDto, AnimeSearchQueryDto } from '../common/dto';
import type { AnimeSummary, Genre } from '../common/schemas';

/**
 * Catalog read endpoints (T016, T017). The global ZodValidationPipe validates the
 * search query against AnimeSearchQueryDto (missing/oversized q -> 400).
 */
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('genres')
  @ApiOkResponse({ type: [GenreDto] })
  getGenres(): Promise<Genre[]> {
    return this.catalog.getGenres();
  }

  @Get('anime/search')
  @ApiOkResponse({ type: [AnimeSummaryDto] })
  search(@Query() query: AnimeSearchQueryDto): Promise<AnimeSummary[]> {
    return this.catalog.searchAnime(query.q);
  }

  @Get('anime/showcase')
  @ApiOkResponse({ type: [AnimeSummaryDto] })
  showcase(): Promise<AnimeSummary[]> {
    return this.catalog.getShowcase();
  }
}
