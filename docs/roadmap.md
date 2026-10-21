# SiteLift Roadmap

_Last updated: 2026-10-21. This is a plan, not a list of claimed shipped features._

## Product direction

**MVP:** A public, credential-free API content mapper and exporter for website/CMS migration. Import structured content from a preconfigured public API or local sample data, normalize it into a portable model, preview records, and export JSON/CSV. Ship alongside a factual `/case-study` page and a readable GitHub repository, deployed on Vercel.

**First major post-launch feature:** User-defined API endpoint import, with inspected JSON structure and configurable field mapping, after an explicit security and CORS/SSRF design review. **Then:** WordPress REST extraction and, where justified, an optional WordPress plugin for custom content. Website crawling is not an initial requirement.

This pivot explicitly prioritizes getting a useful, defensible product online quickly. See `docs/architecture.md` for design and security boundaries.

## Verified existing repository work

- [x] Next.js/TypeScript initial site and WordPress credential-based connection-check prototype on `main`.
- [x] Basic trusted-host HTTPS WordPress endpoint on `main`.
- [x] `AGENTS.md`, architecture and roadmap context added to `main` through reviewed PR #1.
- [x] Phase 1 characterization tests and Phase 2 WordPress client refactor committed on `feature/wordpress-client` (not on `main` as last checked). Agent reported 71 passing tests, lint and build. Do not infer these checks ran in CI.
- [ ] Merge or otherwise integrate `feature/wordpress-client` after independent PR review if/when needed for the WordPress connector. **Do not block the API MVP on this work.**

## New MVP delivery slices - preferred order

### Slice 1: Working content import and preview

- [x] Define a **minimal typed SiteLift content schema**, including source identity, title, body and optional metadata; document version and missing-value policy.
- [x] Choose **one reliable, fixed public content API** with meaningful record data. Use a hardcoded/configured API origin and safe query parameters; no arbitrary URL fetching.
- [x] Include a clearly labelled bundled sample dataset so the app remains demonstrable without third-party uptime.
- [x] Build a simple, useful source-selection interface and trigger import.
- [x] Fetch a **bounded** number of records with timeout, no redirect following, response-size checks and safe validation.
- [x] Convert the source response to the canonical schema and display useful records with empty/loading/failure states.
- [x] Write focused tests for schema normalization, API error handling and route behaviour; run lint/build.
- [x] Prepare one coherent, tested vertical slice on `feature/api-import` for PR review.
- [ ] Owner review and merge of Slice 1. No automatic merge or public deployment.

**Implemented on the feature branch, pending review:** A visitor can open SiteLift, choose public API or sample data, import and see normalized content. No credentials required, no unrestricted fetch proxy.

### Slice 2: Useful portable exports

- [ ] Download normalized records as versioned JSON with source metadata.
- [ ] Download deterministic, UTF-8 CSV with safe quotes/newlines, defined handling of nested data, and spreadsheet-formula injection protection.
- [ ] Show counts and export success/failure, and test escaping, empty datasets, unsafe strings and bounds.
- [ ] Open PR, review and verify download manually in the browser.

**Acceptance:** Imported content can be downloaded and inspected in a normal JSON viewer or Excel-compatible spreadsheet.

### Slice 3: Portfolio case study

- [ ] Create responsive `/case-study` page and link it prominently from the home page.
- [ ] Explain the **actual** purpose and user workflow, show a small architecture diagram, list technology roles, decisions and trade-offs.
- [ ] Include real testing/security decisions and limitations, GitHub link and live demo CTA.
- [ ] Explicitly distinguish implemented vs planned integrations. Don't claim metrics, features or outcomes without evidence.
- [ ] Consider a screenshot of the working UI once available.

**Acceptance:** Someone evaluating the developer can learn what SiteLift does and why key technical decisions were made in a couple of minutes.

### Slice 4: Public release

- [ ] GitHub Actions CI for `pnpm test:ci`, `pnpm lint`, `pnpm build`.
- [ ] Update README with use case, screenshots, local setup, commands, architecture links, API limitations and live demo.
- [ ] Verify live API controls, bounded imports/exports, rate limiting/admission as appropriate, handling of secrets and deploy configuration.
- [ ] Deploy to Vercel; confirm functional UI, public API mode, fixture fallback, downloads and case study.
- [ ] Add project link to portfolio/job applications after live verification.

**Acceptance:** Employers can open SiteLift and immediately try a complete import-preview-export flow and read the case study.

## Subsequent work, not MVP blockers

### First priority after launch: User-defined API endpoints

- [ ] Design a safe custom endpoint workflow that does not expose unrestricted server-side fetching, including SSRF/DNS rebinding protections, allowed protocols, redirects, timeouts, rate limits and payload/record caps.
- [ ] Support user-entered public JSON API URLs once the security model is approved; document browser-CORS limitations and decide whether browser-only or server-assisted fetching is appropriate.
- [ ] Inspect response shapes and let users map source fields into SiteLift's canonical content schema, with mapping validation and meaningful errors.
- [ ] Keep imports bounded and exports compatible with the existing JSON/CSV pipeline; include tests and a worked case-study example.

### WordPress integration

- [ ] Review/merge or reuse tested modules from `feature/wordpress-client`.
- [ ] Finish approved WordPress Phase 3.1 user response validation (positive safe integer ID, safe display name and sanitized 502 for invalid upstream data).
- [ ] Support published posts/pages through WordPress public REST API first, without requiring credentials for public endpoints.
- [ ] Add authenticated extraction only after connection lifecycle, permission checks, rate limits, request/response bounds and SSRF/network review.
- [ ] Consider WordPress plugin only for genuinely missing REST functionality: ACF/CPT/custom relationships, complex block content or a controlled site-originated export.

### Broader migration ambitions

- [ ] Additional source APIs and eventually destination-specific exports or integrations.
- [ ] Optional structured content ZIP with manifest and image URL CSV inventory; initially reference image URLs rather than downloading every asset.
- [ ] Optional HTML crawl/scraper with URL/network controls, robots/access/rights policy, pagination, concurrency and budget limits.
- [ ] Editable field mapping if actual users need more than predefined mappings.

## How Codex should continue

1. Confirm current branch and inspect relevant code, `AGENTS.md` and `docs/architecture.md`.
2. Slice 1 is implemented on `feature/api-import` from up-to-date main and awaits owner review. After it is merged, start Slice 2 only with approval. Keep the unmerged WordPress branch separate.
3. For a clear, approved slice, make reasonable minor implementation decisions, implement, test and present results without requiring intermediary prompts from another AI.
4. Ask the human before broadening scope, changing external-access security assumptions or deploying publicly.
5. Create a PR for human review; do not merge it autonomously. The ChatGPT conversation can independently review GitHub PRs.

## Definition of done

- Fits the agreed slice and acceptance criteria.
- Tests cover the important failure modes; lint/build results are reported accurately.
- Documentation and case study claims describe implemented features only.
- No unexpected secrets, dependencies, public fetch capabilities or unrelated file changes.
- Work is available on a feature branch with a PR; merge only with owner approval.
