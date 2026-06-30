import createClient from 'openapi-fetch';
import type { components, paths } from './schema';

/**
 * Typed API client (T024). `paths` is generated from contracts/openapi.yaml, so
 * every call is type-checked against the contract — a changed endpoint becomes a
 * compile error here rather than a runtime surprise. Regenerate after a contract
 * change with: npx openapi-typescript ../specs/.../openapi.yaml -o src/api/schema.d.ts
 */

// Same-origin behind the NGINX proxy; falls back to the backend's dev port for
// a bare `npm run dev` (CORS is enabled server-side).
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

const client = createClient<paths>({ baseUrl });

// Contract types re-exported for components to consume.
export type Genre = components['schemas']['Genre'];
export type AnimeSummary = components['schemas']['AnimeSummary'];
export type TasteProfile = components['schemas']['TasteProfile'];
export type Recommendation = components['schemas']['Recommendation'];
export type InterpretResponse = components['schemas']['InterpretResponse'];

const INTERPRET_LANGS = ['en', 'es', 'pt', 'fr'] as const;
type InterpretLang = (typeof INTERPRET_LANGS)[number];

export interface RecommendationsResult {
  results: Recommendation[];
  aiAssisted: boolean;
}

export async function getGenres(): Promise<Genre[]> {
  const { data, error } = await client.GET('/genres');
  if (error || !data) throw new Error('Failed to load genres');
  return data;
}

export async function searchAnime(q: string): Promise<AnimeSummary[]> {
  const { data, error } = await client.GET('/anime/search', { params: { query: { q } } });
  if (error || !data) throw new Error('Search failed');
  return data;
}

export async function getShowcase(): Promise<AnimeSummary[]> {
  const { data, error } = await client.GET('/anime/showcase');
  if (error || !data) throw new Error('Failed to load showcase');
  return data;
}

export async function getRecommendations(profile: TasteProfile): Promise<RecommendationsResult> {
  const { data, error } = await client.POST('/recommendations', { body: profile });
  if (error || !data) throw new Error('Failed to generate recommendations');
  return data as RecommendationsResult;
}

/** Interpret a free-text taste description into known genres/themes (US4). */
export async function interpretTaste(text: string, language?: string): Promise<InterpretResponse> {
  const lang = INTERPRET_LANGS.includes(language as InterpretLang)
    ? (language as InterpretLang)
    : undefined;
  const { data, error } = await client.POST('/interpret', {
    body: { text, ...(lang ? { language: lang } : {}) },
  });
  if (error || !data) throw new Error('Failed to interpret taste');
  return data;
}
