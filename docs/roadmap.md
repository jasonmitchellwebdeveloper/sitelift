# SiteLift Roadmap

_Last updated: 2026-10-21. Statuses distinguish verified repository state, local reports and future plans._

## Product outcome

A public SiteLift demo deployed to Vercel, with a public GitHub repository that potential employers can inspect. The demo must show realistic inspection and export using sample WordPress content **without asking visitors for credentials**. A live WordPress connection may be restricted to authorised use until its security model is ready.

## Current workstream: WordPress connection

- [x] **Prototype:** create Next.js application, WordPress connection form, trusted-host validation and Application Password authentication check.
- [x] **Phase 1 (branch only):** add Vitest characterization tests and scripts. Reported 29 passing tests.
- [x] **Phase 2 (branch only):** extract `validation.ts`, `client.ts` and `errors.ts`. Latest reported local results: 71 tests passing, lint/build passing. An initially missing `tests/server-only.ts` was later committed. These changes are on `feature/wordpress-client`; do not mark merged until a reviewed PR is merged.
- [ ] **Phase 3.1 (next approved implementation slice):** validate the upstream WordPress authenticated user response.
- [ ] **Phase 3.2:** improve classification of timeouts, malformed inputs and network/upstream failures with updated tests.
- [ ] **Phase 3.3:** input and upstream response-size bounds; document server config.
- [ ] **Phase 3.4:** design endpoint admission and rate limiting before exposing a live connector publicly.
- [ ] **Phase 3.5:** review network-destination/SSRF and DNS/private-address constraints before broadening the allowlist.

## Next approved slice: Phase 3.1

**Context:** On `feature/wordpress-client`, `client.ts` currently trusts parseable successful JSON and falls back to the submitted username even for `{}`. Characterization tests preserve that behaviour. The following is an approved *plan*, not implemented work.

**Acceptance criteria:**

1. Read the upstream JSON as `unknown`. Accept only a non-null, non-array object with `id` that is a **positive safe integer**; reject absent, zero, negative, fractional, string, boolean, unsafe and non-finite values.
2. Invalid JSON, null, arrays, JSON primitives and malformed responses must fail as `INVALID_RESPONSE`.
3. Return a minimal internal `{ id: number; displayName?: string }` user result. Include `displayName` only for a nonempty trimmed string `name`. Never treat submitted username as evidence of authentication.
4. Keep the public response shape `{ success, message }`. Successful named user: `Connected successfully as <display name>!`; valid user without a display name: `Connected successfully to WordPress!`. Do not expose user IDs, credentials or upstream bodies.
5. Map `INVALID_RESPONSE` to HTTP **502** with fixed message: `WordPress returned an invalid authentication response.` This intentionally changes the old catch-all 400 for malformed upstream responses; keep other mappings unchanged for now.
6. Preserve endpoint, hostname policy, HTTPS, WordPress subdirectories, Basic auth, manual redirect refusal, `no-store`, 10-second timeout and injectable fetch.
7. Update old characterization tests deliberately; add tests for valid IDs including `Number.MAX_SAFE_INTEGER`, malformed/unsafe IDs, blank/invalid names, response shapes, and sanitization. Ensure fixtures for successful subdirectory checks contain valid IDs. Test non-finite values carefully: JSON.stringify encodes Infinity as null.
8. Do not modify unrelated modules or add dependencies, sessions, storage, new features or commits directly to `main`.

**Suggested execution within VS Code/Codex:** Inspect current files and tests; implement and test this slice in `feature/wordpress-client`; run `pnpm test:ci`, `pnpm lint`, `pnpm build`; review diff and commit to feature branch; open PR for human review when the workstream is ready. Only ask for a decision if scope/security tradeoffs exceed these criteria. Never merge autonomously.

## Follow-on milestones

### A. Git and developer experience
- [ ] Add CI to run tests, lint and build on pull requests.
- [ ] Configure required passing checks on the protected default branch, once CI is reliable.
- [ ] Replace starter README with quickstart, security model, screenshots/preview and architecture links.

### B. Public demo and inspection
- [ ] Define fixed, non-sensitive sample WordPress data and a clearly marked demo mode.
- [ ] Implement paginated post/page/media inventory with useful previews, from demo data first.
- [ ] Define and test JSON export format; add bounded media export only after resource and safety review.

### C. Live integration and launch
- [ ] Define secure connection lifecycle and WordPress permissions for content access.
- [ ] Complete admission, rate limiting, SSRF and input/output limits for any publicly reachable live endpoint.
- [ ] Deploy a usable credential-free demo to Vercel; verify production behaviour and failure handling.
- [ ] Prepare public portfolio presentation and clean GitHub documentation.

## Definition of done for each slice

- Clear acceptance criteria; focused, maintainable code.
- Tests added/updated for intended behaviour; security regression coverage where relevant.
- `pnpm test:ci`, `pnpm lint`, and `pnpm build` run or skipped with explicit reason.
- Updated docs if behaviour/architecture changed.
- Branch and PR reviewed; user approves any merge to `main`.
