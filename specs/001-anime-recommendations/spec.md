# Feature Specification: Anime Recommendations

**Feature Branch**: `001-anime-recommendations`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "An anonymous web experience where a visitor expresses their anime taste (by choosing genres/themes and naming a few favorite anime) and receives a dynamic, ranked set of anime recommendations drawn from a large catalog. A deterministic core does the heavy matching across the whole catalog; an AI assist refines the ordering of the top candidates and writes a short reason for each. Recommendation strength is shown as a friendly label (Chef's pick / Recommended / Worth a try), never a raw number."

## Clarifications

### Session 2026-06-27

- Q: Should the catalog exclude adult/explicit (hentai / R18) titles? → A: Exclude by default; include them only after the visitor self-confirms they are 18+ (anonymous self-attestation toggle, no account, no formal age verification).
- Q: How does a visitor name their favorite anime? → A: Search-as-you-type autocomplete — the visitor picks real titles from the catalog as they type.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get anime recommendations from a taste form (Priority: P1)

A visitor arrives, chooses the anime genres/themes they enjoy and optionally names a few anime they already love, and submits. The system returns a ranked set of anime recommendations drawn from a large catalog, each shown with its key information and a friendly strength label.

**Why this priority**: This is the core value of the product. On its own it is a complete, usable experience — a visitor can get useful anime suggestions without anything else existing.

**Independent Test**: Fill the form with a known taste (e.g. a couple of genres plus a famous favorite) and confirm a relevant, ordered list of anime is returned, each carrying a strength label, with the named favorites excluded from results.

**Acceptance Scenarios**:

1. **Given** a visitor on the start screen, **When** they select at least one genre/theme and submit, **Then** they receive a ranked list of recommended anime, each with a strength label and key details.
2. **Given** a visitor who also names one or more favorite anime, **When** they submit, **Then** the recommendations reflect similarity to those favorites and the named titles do not appear in the results.
3. **Given** a visitor submits without choosing any preference, **When** they submit, **Then** no results are generated and they receive a clear prompt to add at least one preference.
4. **Given** a visitor's taste is very niche, **When** few strong matches exist, **Then** the system returns the closest available suggestions clearly marked as weaker confidence, or states that not enough matches were found.

---

### User Story 2 - Understand why each anime was suggested (Priority: P2)

For each recommended anime, the visitor sees a short, natural-language explanation of why it fits the taste they expressed.

**Why this priority**: Explanations build trust and make the results feel personal and intelligent, but the recommendations are already valuable without them. This is an enhancement layered on top of US1.

**Independent Test**: With the explanation assist available, confirm each recommendation has a short, relevant reason that references the visitor's stated taste or favorites; with the assist disabled, confirm the ranked list still appears (reasons omitted) and the visitor is never blocked.

**Acceptance Scenarios**:

1. **Given** recommendations have been generated, **When** the AI assist is available, **Then** each recommendation includes a short reason that references the visitor's selected genres/themes or named favorites.
2. **Given** the AI assist is unavailable, **When** recommendations are generated, **Then** the ranked, labeled list is still shown (reasons may be omitted) and the visitor can still use the results.

---

### User Story 3 - Refine taste and regenerate (Priority: P3)

After seeing results, the visitor can adjust their selections or favorites and regenerate an updated set of recommendations without starting over.

**Why this priority**: Iteration helps the visitor home in on better suggestions, but the first result set already delivers the core value. Convenience, not a necessity.

**Independent Test**: From a results view, change one significant preference, regenerate, and confirm the recommendations update to reflect the change.

**Acceptance Scenarios**:

1. **Given** a visitor is viewing recommendations, **When** they change their preferences and resubmit, **Then** an updated ranked list is shown that reflects the changes.

---

### Edge Cases

- **No preferences selected**: the system asks for at least one preference and generates nothing.
- **Very niche or contradictory taste**: the system broadens sensibly and returns the closest available suggestions, clearly marked as weaker confidence, rather than failing.
- **Favorite search returns no matches**: the visitor is told no matching title was found and can continue without that favorite.
- **Explicit content not confirmed**: adult/explicit titles are excluded from results unless the visitor has self-confirmed they are 18+.
- **Catalog data source temporarily unavailable**: the visitor sees a friendly error and the experience does not crash.
- **AI assist unavailable**: the system falls back to its deterministic ordering and omits the per-item reasons.
- **Duplicate selections**: duplicates are ignored without affecting the result.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST let a visitor express taste by selecting from a predefined set of anime genres/themes.
- **FR-002**: System MUST let a visitor optionally add one or more favorite anime by searching the catalog as they type and selecting real titles from the results (search-as-you-type).
- **FR-003**: System MUST draw recommendations from a large catalog of anime, not a small fixed list.
- **FR-004**: System MUST rank recommendations using multiple taste signals (such as genre/theme overlap and similarity to named favorites) so that results vary meaningfully as the visitor's inputs change.
- **FR-005**: System MUST present each recommendation with its key information: title, primary genres/themes, a representative image, and a short synopsis.
- **FR-006**: System MUST present each recommendation's strength as a qualitative label — "Chef's pick" (strong), "Recommended" (medium), or "Worth a try" (low) — and MUST NOT display a raw numeric score to the visitor.
- **FR-007**: System MUST exclude any anime the visitor named as a favorite from the recommendation results.
- **FR-008**: System MUST allow the full experience without requiring an account (anonymous use).
- **FR-009**: System MUST, when the AI assist is available, refine the ordering of the top candidate recommendations and provide a short natural-language reason for each that references the visitor's stated taste.
- **FR-010**: System MUST still return a valid ranked recommendation list with strength labels when the AI assist is unavailable; per-item reasons may be omitted, but recommendations MUST NOT be blocked.
- **FR-011**: System MUST validate submitted preferences and respond to empty or invalid submissions with a clear, actionable message, generating no results.
- **FR-012**: System MUST handle the "few or no strong matches" case by returning the closest available suggestions marked as weaker confidence, or clearly stating that not enough matches were found.
- **FR-013**: System MUST treat catalog data and AI-generated text as untrusted input and validate/sanitize it before displaying it to the visitor.
- **FR-014**: Visitors MUST be able to adjust their preferences and regenerate recommendations without restarting the experience. *(supports US3)*
- **FR-015**: System MUST exclude adult/explicit (e.g. hentai / R18) anime from results by default, and MUST include such titles only after the visitor self-confirms they are 18 or older; this confirmation requires no account and is a self-attestation, not formal age verification.

### Key Entities *(include if feature involves data)*

- **Anime**: a title in the catalog, described by attributes such as primary genres/themes, a short synopsis, a representative image, a popularity indicator, and a maturity/content rating (used to gate explicit titles).
- **Genre/Theme (Tag)**: a category used both to describe anime and to let a visitor express taste.
- **Taste Profile**: the set of selected genres/themes, chosen favorite anime, and whether the visitor has confirmed 18+ (which controls inclusion of explicit titles), for a single anonymous session.
- **Recommendation**: an anime paired with a qualitative strength label and, when available, a short explanation — produced relative to a Taste Profile.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can go from landing on the start screen to seeing recommendations in under 2 minutes.
- **SC-002**: For a valid taste input, the system returns at least 10 recommendations, or a clear "not enough matches" message.
- **SC-003**: Changing a major preference meaningfully changes the result set — at least 30% of the recommended titles differ — demonstrating the results are dynamic, not static.
- **SC-004**: 100% of recommendations are shown with a qualitative strength label and with no raw numeric score visible to the visitor.
- **SC-005**: When the AI assist is available, every recommendation includes a human-readable reason that references the visitor's stated taste, and in informal user testing at least 80% of testers rate the top suggestions as relevant to what they asked for.
- **SC-006**: Visitors see their recommendations within about 5 seconds of submitting their taste.
- **SC-007**: With the AI assist disabled, the system still returns a ranked, labeled recommendation list (graceful degradation is verifiable).

## Assumptions

- Use is anonymous and single-session; nothing is persisted long-term in the MVP (accounts and history are a later feature).
- The anime catalog is sourced from a public anime API or dataset (not web scraping), and its availability during a request is assumed.
- The experience is web-first and not mobile-first; a native mobile app is a later feature.
- A finite, predefined set of genres/themes is available for the visitor to choose from.
- Favorites are selected via catalog search-as-you-type, so they always map to real catalog entries.
- Adult/explicit titles are excluded by default; a visitor may opt in via a one-time 18+ self-confirmation (no account, no formal age verification).
- To control cost and stay within model limits, the AI assist operates only on a limited shortlist of top candidates produced by the deterministic stage — never the full catalog.
- The strength tiers strong/medium/low are presented to visitors as "Chef's pick" / "Recommended" / "Worth a try".

## Out of Scope (MVP)

- User accounts, login, and persisted taste/history.
- User-to-user matching or any social/messaging features.
- Free-text natural-language taste input (only structured selection in the MVP).
- A native mobile (React Native) app.
- AI-curated themed groupings/buckets of results (possible later enhancement).
