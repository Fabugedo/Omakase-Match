import Ajv, { type JSONSchemaType } from 'ajv';

/**
 * AJV validators for raw Jikan v4 responses (T011). Jikan is untrusted external
 * input (Constitution Principle III), so every payload is structurally validated
 * before ingestion touches it. Schemas are deliberately lenient — only the fields
 * we actually consume are constrained; unknown fields are tolerated so upstream
 * additions don't break ingestion.
 */

const ajv = new Ajv({ allErrors: true, removeAdditional: false });

/** A genre/theme/demographic tag as embedded inside an anime item. */
export interface JikanTag {
  mal_id: number;
  name: string;
}

/** The subset of a Jikan anime object the catalog depends on. */
export interface JikanAnime {
  mal_id: number;
  title: string;
  title_english?: string | null;
  synopsis?: string | null;
  images?: { jpg?: { image_url?: string | null } };
  popularity?: number | null;
  score?: number | null;
  members?: number | null;
  rating?: string | null;
  year?: number | null;
  episodes?: number | null;
  genres?: JikanTag[];
  themes?: JikanTag[];
  demographics?: JikanTag[];
}

export interface JikanAnimeListResponse {
  data: JikanAnime[];
  pagination?: {
    has_next_page?: boolean;
    current_page?: number;
    last_visible_page?: number;
  };
}

/** A genre entry from the master /genres/anime endpoint. */
export interface JikanGenre {
  mal_id: number;
  name: string;
}

export interface JikanGenreListResponse {
  data: JikanGenre[];
}

const tagSchema: JSONSchemaType<JikanTag> = {
  type: 'object',
  properties: {
    mal_id: { type: 'integer' },
    name: { type: 'string' },
  },
  required: ['mal_id', 'name'],
  additionalProperties: true,
};

const animeSchema: JSONSchemaType<JikanAnime> = {
  type: 'object',
  properties: {
    mal_id: { type: 'integer' },
    title: { type: 'string' },
    title_english: { type: 'string', nullable: true },
    synopsis: { type: 'string', nullable: true },
    images: {
      type: 'object',
      nullable: true,
      properties: {
        jpg: {
          type: 'object',
          nullable: true,
          properties: {
            image_url: { type: 'string', nullable: true },
          },
          required: [],
          additionalProperties: true,
        },
      },
      required: [],
      additionalProperties: true,
    },
    popularity: { type: 'integer', nullable: true },
    score: { type: 'number', nullable: true },
    members: { type: 'integer', nullable: true },
    rating: { type: 'string', nullable: true },
    year: { type: 'integer', nullable: true },
    episodes: { type: 'integer', nullable: true },
    genres: { type: 'array', nullable: true, items: tagSchema },
    themes: { type: 'array', nullable: true, items: tagSchema },
    demographics: { type: 'array', nullable: true, items: tagSchema },
  },
  required: ['mal_id', 'title'],
  additionalProperties: true,
};

const animeListSchema: JSONSchemaType<JikanAnimeListResponse> = {
  type: 'object',
  properties: {
    data: { type: 'array', items: animeSchema },
    pagination: {
      type: 'object',
      nullable: true,
      properties: {
        has_next_page: { type: 'boolean', nullable: true },
        current_page: { type: 'integer', nullable: true },
        last_visible_page: { type: 'integer', nullable: true },
      },
      required: [],
      additionalProperties: true,
    },
  },
  required: ['data'],
  additionalProperties: true,
};

const genreSchema: JSONSchemaType<JikanGenre> = {
  type: 'object',
  properties: {
    mal_id: { type: 'integer' },
    name: { type: 'string' },
  },
  required: ['mal_id', 'name'],
  additionalProperties: true,
};

const genreListSchema: JSONSchemaType<JikanGenreListResponse> = {
  type: 'object',
  properties: {
    data: { type: 'array', items: genreSchema },
  },
  required: ['data'],
  additionalProperties: true,
};

export const validateAnimeListResponse = ajv.compile(animeListSchema);
export const validateGenreListResponse = ajv.compile(genreListSchema);
