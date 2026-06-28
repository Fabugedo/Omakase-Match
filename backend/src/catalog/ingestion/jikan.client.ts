import {
  validateAnimeListResponse,
  validateGenreListResponse,
  type JikanAnimeListResponse,
  type JikanGenreListResponse,
} from './jikan.schema';

/**
 * Minimal Jikan v4 client with request throttling (T012). Jikan's public limits
 * are ~3 req/s and 60 req/min; we serialize requests with a fixed gap to stay
 * comfortably under both, retry on HTTP 429, and validate every payload with the
 * AJV schemas before returning it (untrusted external input — Principle III).
 */

const DEFAULT_BASE_URL = 'https://api.jikan.moe/v4';
const DEFAULT_MIN_INTERVAL_MS = 700; // ~1.4 req/s
const MAX_RETRIES = 4;

export type GenreFilter = 'genres' | 'themes' | 'demographics';

export interface JikanClientOptions {
  baseUrl?: string;
  minIntervalMs?: number;
  fetchFn?: typeof fetch;
}

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export class JikanClient {
  private readonly baseUrl: string;
  private readonly minIntervalMs: number;
  private readonly fetchFn: typeof fetch;
  // Serializes requests so the inter-request gap is actually enforced.
  private queue: Promise<unknown> = Promise.resolve();

  constructor(options: JikanClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.minIntervalMs = options.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  /** Run a task in the serialized queue, leaving a gap before the next one. */
  private throttle<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      try {
        return await task();
      } finally {
        await delay(this.minIntervalMs);
      }
    });
    // Keep the chain alive regardless of this task's outcome.
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async getJson(path: string): Promise<unknown> {
    return this.throttle(async () => {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        const res = await this.fetchFn(`${this.baseUrl}${path}`);
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get('retry-after'));
          const wait =
            Number.isFinite(retryAfter) && retryAfter > 0
              ? retryAfter * 1000
              : 1000 * (attempt + 1);
          await delay(wait);
          continue;
        }
        if (!res.ok) {
          throw new Error(`Jikan request failed: GET ${path} -> HTTP ${res.status}`);
        }
        return res.json();
      }
      throw new Error(`Jikan request rate-limited after ${MAX_RETRIES} retries: GET ${path}`);
    });
  }

  /** One page (25 items) of the most-popular anime, ordered by popularity. */
  async getTopAnime(page: number): Promise<JikanAnimeListResponse> {
    const json = await this.getJson(`/top/anime?filter=bypopularity&page=${page}`);
    if (!validateAnimeListResponse(json)) {
      throw new Error(
        `Invalid Jikan anime-list response: ${JSON.stringify(validateAnimeListResponse.errors)}`,
      );
    }
    return json;
  }

  /** Master list of genres/themes/demographics (used to assign GenreKind). */
  async getGenres(filter: GenreFilter): Promise<JikanGenreListResponse> {
    const json = await this.getJson(`/genres/anime?filter=${filter}`);
    if (!validateGenreListResponse(json)) {
      throw new Error(
        `Invalid Jikan genre-list response: ${JSON.stringify(validateGenreListResponse.errors)}`,
      );
    }
    return json;
  }
}
