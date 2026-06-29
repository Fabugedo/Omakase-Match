# Frontend Design Notes — Omakase-Match

> Captured during a design brain-dump (2026-06-27). These guide the UI built in Phase 3
> (T025 taste form, T026 results). Visual direction only — behavior lives in spec.md.

## Core feeling

**Cozy, warm, friendly, and trustworthy — the "omakase" spirit: "relax, I'll choose for you."**
The experience should feel like a kind, knowledgeable friend (or a chef) recommending your next
favorite anime — closer to *discovering a good book in a warm little shop* than using a tech tool.

## Mood / references

- Classic, **hand-painted anime warmth** — in the spirit of Ragnarok Online's soft, painterly art
  (NOT pixel art, NOT modern flashy game UI). Gentle, storybook, inviting.
- Discovery & comfort: the feeling of browsing a cozy library/bookshop for your next read.
- Omakase / trust: "I leave it up to you" — calm confidence, no pressure, delightful surprise.

## Explicitly AVOID (from user feedback on a rejected ChatGPT mock)

- ❌ Futuristic / cyber / "AI" aesthetic, neon glows, dark HUD dashboards.
- ❌ Video-game/esports UI: glowing percentage rings, role badges (Tank/DPS/Healer), stat panels.
- ❌ Cold, high-contrast, techy palettes.
- ❌ Anything implying **player-to-player matchmaking** — this app matches a person to *anime*,
  not to other users. No member profiles, no "party compatibility %".

## Palette direction (to refine in Phase 3)

- **Soft, warm, low-contrast.** Think creamy/off-white backgrounds, gentle pastels, muted accents.
- A warm, friendly accent (e.g. soft coral / peach / amber, or a gentle plum) — *soft*, not neon.
- Generous whitespace; rounded corners; soft shadows; calm, readable contrast (still accessible).

## Typography

- Friendly and characterful **display** font for headings (warm, a little playful — not corporate,
  not sci-fi). Highly **readable** body font. Comfortable sizes and line-height.

## Imagery

- Cozy anime illustration / soft lighting for the hero (warm, welcoming, painterly).
- Real **anime cover art** featured large in results (the covers are the stars).

## Screen-by-screen (maps to our real spec, not the rejected mock)

### Hero / start
- Warm headline conveying "tell us your taste, we'll serve you anime you'll love."
- One clear primary action → start the taste form. Friendly, uncluttered.
- (Optional later) a few soft trust cues — but NOT fake stats/percentages.

### Taste form (T025)
- Pick genres/themes as soft, tappable **chips/tags** (cozy, satisfying to select).
- Search-as-you-type for favorite anime (gentle autocomplete with small covers).
- A friendly **18+ toggle** (off by default), phrased kindly.
- Submit feels like handing the order to the chef ("Omakase!" / "Surprise me").

### Results (T026)
- Anime shown as warm **cards**: cover image, title, a few genre chips, and the short "why" blurb.
- Grouped/labeled by band with culinary-warm wording:
  - **Chef's pick** (strong) · **Recommended** (medium) · **Worth a try** (low)
- **No numeric scores shown.** Friendly empty / "not enough matches" / weak-confidence states.
- All external/AI text rendered as plain text (safety) — but styled warmly.

## How we'll realize it (Phase 3)

Use the frontend-design capability to produce a concrete look, then verify in a real browser with
Playwright, iterating until it matches this cozy/omakase direction. Keep it accessible (keyboard,
semantic markup, good labels) per the constitution.

## Direction update — 2026-06-29 (supersedes the cozy palette above)

After seeing the first cozy build, the user found it too plain and **revised the visual
direction to a 90s / Evangelion aesthetic** (the *concept* — "we choose for you, person→anime" —
is unchanged; only the look changed).

- **DECISION — aesthetic:** dark, high-contrast, near-black background; cream text; **NERV red**
  + **hazard amber** accents; film grain + subtle scanlines; bold condensed uppercase type
  (Oswald), monospace terminal labels (JetBrains Mono), Inter body. Angular (small radii).
- **DECISION — hero:** a tilted **collage of real catalog cover art** (served by
  `GET /anime/showcase`, ~30 most-popular SFW titles) behind a dark scrim + bold headline + CTA.
  Chosen because we cannot generate custom character art in-tool; the collage uses real content.
- **Structure:** single scrolling landing — hero → "01 · tell us what you love" (taste form) →
  "02 · your matches" (results). Same flow, presented as a landing.
- **Still AVOID (unchanged):** player-to-player matchmaking, party/roles (Tank/DPS/Healer),
  compatibility %, member profiles, fake stats. We match a person to *anime*.
- **RISK/limitation:** a bespoke hero illustration would need to be commissioned/generated
  separately and dropped in later; the collage is the ship-now solution.
