# SiteLift Architecture

_Last updated: 2026-10-21. Decisions and proposed behaviour are identified separately from the implemented application._

## Product definition

**SiteLift is an API content integration and export tool for website and CMS migration.**

The first release imports structured records from a supported public API, transforms them into a consistent content model, previews them and exports JSON or CSV. The longer-term direction is a connector-based migration platform: WordPress and other CMS sources first, then possibly destination integrations. A general-purpose website scraper/archive is **not** part of the first release.

**Primary product promise:** Import. Transform. Export.

**Portfolio goal:** a live, useful Vercel demo and public GitHub repository demonstrating real-world Next.js/React/TypeScript, REST API integration, modelling, validation, errors, testing and deliberate security decisions. Include an accurate `/case-study` page that helps hiring managers understand the project.

## MVP user journey (approved direction, not yet implemented)

1. Open the app without signing up or supplying credentials.
2. Choose a **preconfigured, allowlisted public content API**. Provide bundled deterministic sample data as an offline/reliability fallback.
3. Fetch a bounded set of records through a controlled integration; show loading, empty, success and failure states.
4. Normalize the source data to a documented, provider-independent SiteLift content model.
5. Preview the normalized records and the source-to-target field mapping.
6. Export the normalized content as JSON or CSV with predictable column/field semantics.
7. Navigate to `/case-study` for the purpose, technology stack, architecture, decisions, tests, constraints and real implementation status.

A single good end-to-end source integration is enough to ship the first release. Editable mapping, multiple live API sources, accounts, databases, ZIP packaging and remote destination APIs are follow-on work, not blockers.

## Current implementation (repository state)

- Next.js 16.4.2 App Router, React 19.3, TypeScript strict, pnpm.
- `src/app/page.tsx` renders the initial WordPress connection-check form `src/components/WordPressConnection.tsx`.
- `POST /api/wordpress/connect` checks a WordPress Application Password through `wp-json/wp/v2/users/me` using a trusted hostname and server-side Basic authentication.
- `feature/wordpress-client` (unmerged as last checked) contains Vitest and refactored validation, WordPress client and safe error mapping modules. Local agent reported 71 passing tests plus passing lint/build at Phase 2; verify in the current branch before relying on this.
- No content imports, preview, export, case-study route, Vercel deployment or public demo currently exist. Do not describe proposed features as implemented.

The unmerged WordPress integration is **preserved as future connector work**, not deleted or required to finish the new public API MVP. Continue MVP development on a separate feature branch from an up-to-date `main`. Coordinate any future cherry-picks or merges explicitly.

## Proposed MVP technical shape

Keep the implementation small and testable, avoiding a speculative plugin framework.

- **UI:** Next.js App Router frontend with source selection, import state, normalized record preview, export control and a static case-study route.
- **Source adapters:** begin with one explicitly configured public provider and one local fixture source. Implement source-specific fetching and normalization behind a small, typed interface only when a real second source justifies it.
- **Server boundary:** a controlled route handler for external API calls if needed. Never accept arbitrary fetchable URLs in the publicly deployed API.
- **Canonical content model:** define a small, versionable schema suitable for migration (for example source identity, title, body, URL, publication data and media references when available). The precise schema and null/missing-value policy must be settled through an implementation task and tests.
- **Exports:** JSON as canonical format; CSV as portable tabular projection with clearly defined escaping, encoding, nulls and nested-field handling. Keep outputs bounded and deterministic.
- **Testing:** synthetic fixtures, mocked `fetch`, integration/route tests, serialization tests; no dependency on live APIs for CI.

Avoid requiring an external service for the site's basic demonstrability: use deterministic fixture data and mark it clearly as demo/sample content. Real API integration must be distinguishable from fixture mode.

## Case study design

The `/case-study` route is **part of MVP**, not a future marketing-only task. Cover:

- Problem and intended users: moving content between websites/CMS platforms.
- End-to-end user flow with a link to try the live import/export.
- Actual architecture and data flow, ideally a small diagram.
- Tech stack only where used, and what each technology does.
- Key engineering decisions: fixed sources instead of arbitrary URLs, normalized model, error handling, pagination/limits, tests and safe export.
- Challenges and trade-offs, with real examples.
- Current results and limitations, separating **implemented**, **in progress** and **planned**.
- Links to GitHub and testable code. Do not invent performance measurements, screenshots or outcomes.

Present it as a concise engineering case study, not a wall of logos or unverified claims.

## WordPress connector (later)

The existing authenticated WordPress code can eventually power an optional source connector. Public WordPress REST endpoints often expose published content without credentials; an authenticated option may expose other content permitted to the WordPress user, not necessarily requiring an administrator account.

A small WordPress plugin is **optional**, not needed to read standard public REST data. Explore a plugin only if concrete export requirements justify it (custom fields, private data, CPT visibility, advanced taxonomies, Gutenberg structure or a safer site-originated export).

Website crawling/scraping is a possible later connector, not the near-term MVP. Never assume scraped HTML equals a restorable backup.

## Security and deployment gates

- The public demo **must not require WordPress credentials**. Do not deploy the current live WordPress connection endpoint without separately approved access controls.
- No arbitrary user-supplied outbound URLs. Use preconfigured allowlisted remote APIs, safe fixed endpoints, redirect refusal, timeouts, destination checks where appropriate, bounded response sizes and rate limits/admission protections.
- Separate browser-to-SiteLift and SiteLift-to-source security boundaries. No secrets in Git, logs, telemetry, URLs, tests or public error responses.
- Defend against remote API errors, malicious/unexpected JSON, oversized responses and export formula injection in spreadsheet-compatible CSV cells.
- Live third-party APIs can fail or change; provide a truthful fixture fallback and stable tests rather than implying a successful real request.
- Reassess any broad host-fetch feature for SSRF, DNS rebinding and access/ownership concerns.
- Vercel's execution and response constraints matter for large future exports. MVP must bound record counts and output sizes.
- No secrets, user accounts, persisted credentials or database are needed for the first public API demo.

## Workflow and references

- `AGENTS.md` defines development, security, testing and PR norms.
- `docs/roadmap.md` defines scope and near-term slices.
- Work on `feature/*` or `docs/*` branches, PR for review, owner explicitly approves merge.
- Source code is authoritative for implemented state. Update this document when architecture actually changes.
