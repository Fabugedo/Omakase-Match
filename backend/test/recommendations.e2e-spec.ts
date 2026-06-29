import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

/**
 * Integration test for POST /recommendations (T023). Boots the real app against
 * the ingested catalog and asserts the spec's US1 acceptance: a banded list with
 * no explicit leakage, favorites excluded, and 400 on an empty profile.
 *
 * Requires the DB up (docker compose up -d db) with the catalog ingested.
 */
const ACTION_GENRE_ID = 1; // common genre -> plenty of candidates

describe('POST /recommendations (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a banded, AI-off list of at least 10 results', async () => {
    const res = await request(app.getHttpServer())
      .post('/recommendations')
      .send({ genreIds: [ACTION_GENRE_ID] })
      .expect(200);

    expect(res.body.aiAssisted).toBe(false);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThanOrEqual(10);

    for (const r of res.body.results) {
      expect(typeof r.id).toBe('number');
      expect(typeof r.title).toBe('string');
      expect(Array.isArray(r.genres)).toBe(true);
      expect(['CHEFS_PICK', 'RECOMMENDED', 'WORTH_A_TRY']).toContain(r.band);
      expect(r.reason).toBeNull(); // no AI yet
    }
  });

  it('never leaks explicit titles when includeExplicit is false', async () => {
    const res = await request(app.getHttpServer())
      .post('/recommendations')
      .send({ genreIds: [ACTION_GENRE_ID], includeExplicit: false })
      .expect(200);

    const ids: number[] = res.body.results.map((r: { id: number }) => r.id);
    const explicit = await prisma.anime.count({
      where: { id: { in: ids }, isExplicit: true },
    });
    expect(explicit).toBe(0);
  });

  it('excludes a chosen favorite from the results', async () => {
    const first = await request(app.getHttpServer())
      .post('/recommendations')
      .send({ genreIds: [ACTION_GENRE_ID] })
      .expect(200);
    const favoriteId: number = first.body.results[0].id;

    const second = await request(app.getHttpServer())
      .post('/recommendations')
      .send({ genreIds: [ACTION_GENRE_ID], favoriteAnimeIds: [favoriteId] })
      .expect(200);

    const ids: number[] = second.body.results.map((r: { id: number }) => r.id);
    expect(ids).not.toContain(favoriteId);
  });

  it('rejects an empty taste profile with 400', async () => {
    await request(app.getHttpServer()).post('/recommendations').send({ genreIds: [] }).expect(400);
  });
});
