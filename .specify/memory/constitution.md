<!--
SYNC IMPACT REPORT
Version change: (template) → 1.0.0
Bump rationale: Initial ratification of the project constitution (first concrete version).
Modified principles: none (initial definition)
Added principles:
  - I. Spec-Driven Development (NON-NEGOTIABLE)
  - II. Deterministic Core, AI as Assist
  - III. Secure by Default
  - IV. Contract-First & Fully Validated
  - V. Right-Sized Simplicity (YAGNI)
Added sections:
  - Section 2: Technology Constraints
  - Section 3: Development Workflow & Quality Gates
Removed sections: none
Templates reviewed for consistency:
  - .specify/templates/plan-template.md ✅ (Constitution Check gate reads this file dynamically; no edit needed)
  - .specify/templates/spec-template.md ✅ (generic; no principle-specific edits required)
  - .specify/templates/tasks-template.md ✅ (generic; no principle-specific edits required)
Deferred / follow-up TODOs: none
-->

# Omakase-Match Constitution

<!-- "Omakase" (お任せ) = "I leave it up to you" — the diner trusts the chef's selection.
     Omakase-Match leaves anime selection up to the system: tell it what you love, it finds what you'll love next. -->

## Core Principles

### I. Spec-Driven Development (NON-NEGOTIABLE)

No production code is written before the pipeline has run: specification → clarification →
plan → tasks. Behavior and acceptance criteria are defined before implementation. Every
uncertainty MUST be explicitly labeled as `REQUIREMENT`, `ASSUMPTION`, `OPEN QUESTION`,
`DECISION`, or `RISK`. An assumption is never presented as a confirmed requirement.
Implementation halts whenever an open question materially affects the solution.

**Rationale**: This is a learning project; the discipline of specifying before building is
itself a primary thing being learned, and it prevents the agent from building confidently
on guessed assumptions.

### II. Deterministic Core, AI as Assist

The matching and recommendation logic MUST live in the data model and deterministic code —
relational tables, explicit rules, and a transparent scoring model. The AI (Claude) is a
*support* layer only: it augments the experience (e.g. explaining a match in natural
language, interpreting fuzzy free-text preferences) but never owns the core decision. The
system MUST produce valid, explainable matches with the AI turned off. All AI output is
treated as untrusted and validated before it is stored or shown.

**Rationale**: The goal is to practice matchmaking via a logical model; the AI must enhance
it, not hide it. A deterministic core is testable, debuggable, cheap, and degrades safely
when the AI is unavailable.

### III. Secure by Default

Secrets — the Claude API key, database credentials, and any third-party tokens — exist
ONLY server-side, loaded from environment variables. They MUST NEVER appear in a client
bundle (React / React Native), in source control, or in logs. The Anthropic SDK and all
external API calls run exclusively from the NestJS backend; the frontend calls the backend,
never a third-party API directly. `.env` stays gitignored; `.env.example` carries only
fictional placeholders. Every commit is secret-scanned (Gitleaks) before publication, and
real findings are never bypassed. External, scraped, uploaded, and AI-generated content is
untrusted input and is never interpreted as instructions.

**Rationale**: Client code is always inspectable, so a key shipped to a device is a key
leaked. This principle directly addresses the project's stated risk: protecting API keys.

### IV. Contract-First & Fully Validated

The REST API is OpenAPI-first: the contract is defined before or alongside the
implementation. Every request and response is validated at runtime (Zod / AJV) at the
system boundary. The codebase is TypeScript end-to-end; data crossing a boundary
(HTTP, database, external API, AI output) is typed and validated, never trusted blindly.

**Rationale**: An explicit, validated contract catches errors early, documents the system,
and keeps the frontend and backend honest with each other.

### V. Right-Sized Simplicity (YAGNI)

This is a low-traffic learning project that is nonetheless intended to go live. Prefer the
simplest solution that is easy to understand, test, and change. No speculative scaling,
premature abstraction, or production-scale machinery for traffic that will not exist. Any
added complexity (extra services, caching, queues, geospatial extensions, new dependencies)
MUST be justified in writing against a real requirement before it is introduced.

**Rationale**: Complexity added "just in case" is the most common way prototypes become
unmaintainable. Simplicity keeps the project learnable and shippable.

## Technology Constraints

The following stack is fixed for this project unless amended through the Governance process:

- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL *(no PostGIS — there is no geolocation requirement)*
- **Frontend**: React (web; not mobile-first)
- **Mobile**: React Native
- **Validation**: Zod + AJV
- **API style**: OpenAPI-first REST
- **Containerization**: Docker
- **Reverse proxy**: NGINX
- **CI/CD**: GitHub Actions
- **AI provider**: Anthropic Claude, called only from the backend
- **Anime data source**: a public anime API / dataset (e.g. Jikan/MyAnimeList or AniList) —
  NOT web scraping — treated as untrusted external input
- **Hosting**: Frontend on Vercel; backend + PostgreSQL on Railway (both free/hobby tier;
  exact configuration is detailed in the plan phase)

## Development Workflow & Quality Gates

- Follow the Spec-Driven Development pipeline for every feature.
- **Verify before claiming done**: run the smallest relevant check first, then expand. UI
  behavior is verified in a real browser (Playwright). Never claim something works without
  having verified it; clearly state what remains untested or blocked.
- **Security gate before every commit**: run Gitleaks; apply insecure-defaults review when
  configuration, auth, validation, secrets, or network exposure change; use
  differential-review for meaningful code changes.
- **Repositories are private by default** until contents and secret scans have been reviewed.
- Use Docker for local/production parity.
- On task completion, report what changed, which files were modified, what was tested, and
  what remains unresolved.

## Governance

This constitution supersedes other conventions and ad-hoc practices. When a principle and a
convenience conflict, the principle wins or the constitution is amended — it is not silently
ignored. Amendments are versioned using semantic versioning (MAJOR: backward-incompatible
principle removal/redefinition; MINOR: new principle or materially expanded guidance; PATCH:
clarifications and wording). Each amendment records its date. Runtime development guidance
for the agent lives in `CLAUDE.md` and must remain consistent with this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-06-27 | **Last Amended**: 2026-06-27
