import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsResponseDto, TasteProfileDto } from '../common/dto';
import type { RecommendationsResponse } from '../common/schemas';

/**
 * POST /recommendations (T022). The global ZodValidationPipe validates the body
 * against TasteProfileDto, so an empty genreIds array fails (min 1) -> 400.
 */
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Post()
  @HttpCode(200) // contract returns 200, not Nest's default 201 for POST
  @ApiOkResponse({ type: RecommendationsResponseDto })
  generate(@Body() body: TasteProfileDto): Promise<RecommendationsResponse> {
    return this.recommendations.generate(body);
  }
}
