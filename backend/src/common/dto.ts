import { createZodDto } from 'nestjs-zod';
import {
  TasteProfileSchema,
  GenreSchema,
  AnimeSummarySchema,
  RecommendationSchema,
  RecommendationsResponseSchema,
  ErrorSchema,
  AnimeSearchQuerySchema,
  InterpretRequestSchema,
  InterpretResponseSchema,
} from './schemas';

/**
 * DTOs (T015) built from the shared Zod schemas. Used by controllers so a single
 * schema drives runtime validation (ZodValidationPipe), response serialization
 * (ZodSerializerInterceptor), and OpenAPI generation — no drift between them.
 */
export class TasteProfileDto extends createZodDto(TasteProfileSchema) {}
export class GenreDto extends createZodDto(GenreSchema) {}
export class AnimeSummaryDto extends createZodDto(AnimeSummarySchema) {}
export class RecommendationDto extends createZodDto(RecommendationSchema) {}
export class RecommendationsResponseDto extends createZodDto(RecommendationsResponseSchema) {}
export class ErrorDto extends createZodDto(ErrorSchema) {}
export class AnimeSearchQueryDto extends createZodDto(AnimeSearchQuerySchema) {}
export class InterpretRequestDto extends createZodDto(InterpretRequestSchema) {}
export class InterpretResponseDto extends createZodDto(InterpretResponseSchema) {}
