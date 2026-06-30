import { Injectable, Logger } from '@nestjs/common';

interface MatchArgs {
  text: string;
  language?: string;
  vocabulary: string[];
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

/**
 * The ONLY place the AI provider key is read (Constitution Principle III).
 * Default provider: Google Gemini, called over REST with Node's built-in fetch
 * (no SDK dependency). Unconfigured or failed calls return null so the caller
 * falls back to deterministic matching — the app always works AI-off.
 */
@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);
  private readonly apiKey = process.env.GEMINI_API_KEY?.trim();
  private readonly model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Ask the model which of the allowed tags match the free text. Returns the
   * raw name list (the caller MUST validate names against the real vocabulary),
   * or null when unconfigured / on any failure.
   */
  async matchGenres({ text, language, vocabulary }: MatchArgs): Promise<string[] | null> {
    if (!this.apiKey) return null;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: this.buildPrompt({ text, language, vocabulary }) }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: { genres: { type: 'array', items: { type: 'string' } } },
              required: ['genres'],
            },
          },
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        this.logger.warn(`Gemini call failed: HTTP ${res.status}`);
        return null;
      }

      const data = (await res.json()) as GeminiResponse;
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) return null;

      // Untrusted model output: accept only { genres: string[] }.
      const parsed: unknown = JSON.parse(raw);
      const genres = (parsed as { genres?: unknown })?.genres;
      if (!Array.isArray(genres)) return null;
      return genres.filter((g): g is string => typeof g === 'string');
    } catch (err) {
      this.logger.warn(`Gemini call error: ${(err as Error).message}`);
      return null;
    }
  }

  private buildPrompt({ text, language, vocabulary }: MatchArgs): string {
    return [
      "You map a user's free-text description of anime they enjoy to a fixed list of allowed genre/theme tags.",
      'Return ONLY tags from the allowed list that match the described taste. Do not invent tags.',
      'If nothing matches, return an empty array.',
      `Allowed tags: ${vocabulary.join(', ')}.`,
      language ? `The user may be writing in language code "${language}".` : '',
      `User description: """${text}"""`,
    ]
      .filter(Boolean)
      .join('\n');
  }
}
