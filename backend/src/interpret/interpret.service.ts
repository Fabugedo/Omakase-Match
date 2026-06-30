import { Injectable } from '@nestjs/common';
import { CatalogService } from '../catalog/catalog.service';
import { GeminiClient } from '../ai/gemini.client';
import type { Genre, InterpretResponse } from '../common/schemas';

// Best-effort keyword -> canonical vocabulary name (lowercase) for the AI-off
// fallback. English-oriented; the AI path handles other languages and nuance.
const SYNONYMS: ReadonlyArray<readonly [string, string]> = [
  ['romantic', 'romance'],
  ['love', 'romance'],
  ['scary', 'horror'],
  ['spooky', 'horror'],
  ['creepy', 'horror'],
  ['funny', 'comedy'],
  ['laugh', 'comedy'],
  ['fight', 'action'],
  ['fighting', 'action'],
  ['magic', 'fantasy'],
  ['magical', 'fantasy'],
  ['space', 'sci-fi'],
  ['robot', 'sci-fi'],
  ['mecha', 'sci-fi'],
  ['detective', 'mystery'],
  ['cute', 'slice of life'],
  ['cozy', 'slice of life'],
  ['relaxing', 'slice of life'],
  ['sad', 'drama'],
  ['emotional', 'drama'],
  ['sport', 'sports'],
];

/**
 * Free-text taste -> structured taste (US4). Tries the AI provider first; on
 * unconfigured/failed/empty results, falls back to deterministic keyword
 * matching. Either way, the result is validated against the real genre/theme
 * vocabulary so only existing tags are ever returned (FR-020).
 */
@Injectable()
export class InterpretService {
  constructor(
    private readonly catalog: CatalogService,
    private readonly gemini: GeminiClient,
  ) {}

  async interpret(text: string, language?: string): Promise<InterpretResponse> {
    const vocabulary = await this.catalog.getGenres(); // GENRE + THEME only
    const byName = new Map(vocabulary.map((g) => [g.name.toLowerCase(), g]));

    const aiNames = await this.gemini.matchGenres({
      text,
      language,
      vocabulary: vocabulary.map((g) => g.name),
    });
    if (aiNames && aiNames.length > 0) {
      const matched = this.resolve(aiNames, byName);
      if (matched.length > 0) return { genres: matched, source: 'ai' };
    }

    return { genres: this.keywordMatch(text, vocabulary, byName), source: 'keyword' };
  }

  /** Keep only names that exist in the real vocabulary (deduped). */
  private resolve(names: string[], byName: Map<string, Genre>): Genre[] {
    const out: Genre[] = [];
    const seen = new Set<number>();
    for (const name of names) {
      const g = byName.get(name.trim().toLowerCase());
      if (g && !seen.has(g.id)) {
        seen.add(g.id);
        out.push(g);
      }
    }
    return out;
  }

  private keywordMatch(text: string, vocabulary: Genre[], byName: Map<string, Genre>): Genre[] {
    const haystack = text.toLowerCase();
    const out: Genre[] = [];
    const seen = new Set<number>();
    const add = (g?: Genre) => {
      if (g && !seen.has(g.id)) {
        seen.add(g.id);
        out.push(g);
      }
    };

    for (const g of vocabulary) {
      if (haystack.includes(g.name.toLowerCase())) add(g);
    }
    for (const [word, target] of SYNONYMS) {
      if (haystack.includes(word)) add(byName.get(target));
    }
    return out;
  }
}
