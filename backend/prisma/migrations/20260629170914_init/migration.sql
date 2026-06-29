-- CreateEnum
CREATE TYPE "GenreKind" AS ENUM ('GENRE', 'THEME', 'DEMOGRAPHIC');

-- CreateEnum
CREATE TYPE "ContentRating" AS ENUM ('G', 'PG', 'PG13', 'R17', 'RPLUS', 'RX');

-- CreateTable
CREATE TABLE "anime" (
    "id" SERIAL NOT NULL,
    "malId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "titleEnglish" TEXT,
    "synopsis" TEXT,
    "imageUrl" TEXT,
    "popularity" INTEGER,
    "score" DOUBLE PRECISION,
    "members" INTEGER,
    "rating" "ContentRating",
    "isExplicit" BOOLEAN NOT NULL DEFAULT false,
    "year" INTEGER,
    "episodes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genre" (
    "id" SERIAL NOT NULL,
    "malId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "GenreKind" NOT NULL,

    CONSTRAINT "genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anime_genre" (
    "animeId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,

    CONSTRAINT "anime_genre_pkey" PRIMARY KEY ("animeId","genreId")
);

-- CreateIndex
CREATE UNIQUE INDEX "anime_malId_key" ON "anime"("malId");

-- CreateIndex
CREATE INDEX "anime_popularity_idx" ON "anime"("popularity");

-- CreateIndex
CREATE INDEX "anime_isExplicit_idx" ON "anime"("isExplicit");

-- CreateIndex
CREATE UNIQUE INDEX "genre_malId_key" ON "genre"("malId");

-- CreateIndex
CREATE INDEX "anime_genre_genreId_idx" ON "anime_genre"("genreId");

-- CreateIndex
CREATE INDEX "anime_genre_animeId_idx" ON "anime_genre"("animeId");

-- AddForeignKey
ALTER TABLE "anime_genre" ADD CONSTRAINT "anime_genre_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_genre" ADD CONSTRAINT "anime_genre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
