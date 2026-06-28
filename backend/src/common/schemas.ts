import { z } from 'zod';

/**
 * Runtime schemas mirroring contracts/openapi.yaml (T010). These are the single
 * source of truth for request/response validation (Constitution Principle IV).
 * DTOs (T015) and the AI output validator (T029) build on these.
 */

export const GenreKindSchema = z.enum(['GENRE', 'THEME', 'DEMOGRAPHIC']);

export const BandSchema = z.enum(['CHEFS_PICK', 'RECOMMENDED', 'WORTH_A_TRY']);

export const GenreSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  kind: GenreKindSchema,
});

export const AnimeSummarySchema = z.object({
  id: z.number().int(),
  title: z.string(),
  imageUrl: z.string().nullable().optional(),
});

export const TasteProfileSchema = z.object({
  genreIds: z.array(z.number().int()).min(1, 'Select at least one genre or theme'),
  favoriteAnimeIds: z.array(z.number().int()).default([]),
  includeExplicit: z.boolean().default(false),
});

export const RecommendationSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  titleEnglish: z.string().nullable().optional(),
  synopsis: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  genres: z.array(z.string()),
  band: BandSchema,
  reason: z.string().nullable().optional(),
});

export const RecommendationsResponseSchema = z.object({
  results: z.array(RecommendationSchema),
  aiAssisted: z.boolean(),
});

export const ErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
});

export type GenreKind = z.infer<typeof GenreKindSchema>;
export type Band = z.infer<typeof BandSchema>;
export type Genre = z.infer<typeof GenreSchema>;
export type AnimeSummary = z.infer<typeof AnimeSummarySchema>;
export type TasteProfile = z.infer<typeof TasteProfileSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type RecommendationsResponse = z.infer<typeof RecommendationsResponseSchema>;
export type ApiError = z.infer<typeof ErrorSchema>;
