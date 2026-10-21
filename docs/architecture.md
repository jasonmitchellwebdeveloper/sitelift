# SiteLift Architecture

_Last checked: 2026-10-21. This document records the current state and agreed direction, not a claim that future features are implemented._

## Purpose

SiteLift is a publicly demonstrable, portfolio-quality WordPress content inspection and export application. It aims to connect to a WordPress installation using Application Passwords, inspect posts/pages/media, and produce portable content exports. Its public GitHub codebase and future Vercel demo should showcase deliberate engineering, security and tests.

## Architecture today

- **Frontend:** Next.js 16.4.2 App Router, React 19.3, TypeScript (strict); `src/app/page.tsx` renders `src/components/WordPressConnection.tsx`.
- **Connection form:** collects site URL, username and Application Password. It adds HTTPS for convenience and sends a JSON POST to `/api/wordpress/connect`. It displays the returned `{ success, message }` result. There is no authenticated SiteLift account, durable connection or export process.
- **API:** `src/app/api/wordpress/connect/route.ts` uses the Node.js runtime. On `feature/wordpress-client`, it orchestrates JSON parsing, hostname configuration, validation, the WordPress client, and safe HTTP responses.
- **Validation:** `src/lib/wordpress/validation.ts` on `feature/wordpress-client` accepts unknown input and an explicitly supplied `WORDPRESS_ALLOWED_HOST`. It requires HTTPS with an exact allowed hostname, rejects credentials/query/fragment/unexpected ports in URLs, and preserves WordPress subdirectory paths.
- **Client:** `src/lib/wordpress/client.ts` on `feature/wordpress-client` is server-only and uses injectable `fetch` to GET `wp-json/wp/v2/users/me` with Application Password Basic authentication. It disables redirects/caching and sets a 10-second timeout. Credentials exist in request-scoped memory and the upstream authorization header only.
- **Errors:** `src/lib/wordpress/errors.ts` on `feature/wordpress-client` maps typed internal errors to fixed public status/message responses, without exposing upstream bodies or exceptions.
- **Testing:** `feature/wordpress-client` contains Vitest Node-environment tests for the route, validation, client and errors. The latest local report was 71 passing tests, lint passing and build passing; verify again in the working tree and CI before treating those results as current.

The refactored modules and test setup are **on the feature branch**, not yet merged into `main`. Check Git history and branch content before changing them.

## Data flow

1. Visitor submits a site address and WordPress credentials to the SiteLift API.
2. The API validates the request and configured destination.
3. The server makes one fixed WordPress REST call over HTTPS using an Application Password.
4. The response is converted to a safe, minimal success/failure message.
5. The browser displays the result.

Currently this ends at the connection-check message. There is no saved server session, content inventory, export or downloadable ZIP.

## Decisions

1. **Publicly accessible portfolio:** host on Vercel in the future and keep the GitHub repository public. Public demo visitors must be able to try useful flows without using real credentials.
2. **Safe demo path:** build a credential-free sample-data mode for inspection and export; do not equate demo access with access to the live connector.
3. **Live WordPress connectors:** may require a separate authorised/admin-only capability initially. Public arbitrary-host connection is explicitly out of scope until admission controls and SSRF mitigation are designed and reviewed.
4. **Small modules over abstractions:** keep the API thin; separate input/destination validation, WordPress HTTP client, error handling. No database, session store, framework abstraction or new runtime dependencies until a concrete use case justifies them.
5. **Tests before refactors:** preserve documented current behaviour initially; make intentional hardening changes with explicit updated tests.
6. **No automatic credential persistence:** decide ownership, lifetime and disconnect mechanism before implementing multi-request content inspection.
7. **Reviewable Git workflow:** work on feature branches and open pull requests; no direct merges to protected `main`.

## Threat boundaries and deployment blockers

The browser-to-SiteLift transport and SiteLift-to-WordPress transport are different boundaries. HTTPS upstream alone does not secure the browser's credential submission. Never deploy an unrestricted public authentication proxy.

Before public live connections, design and test:
- Route admission/access control and request throttling, including account/host-level abuse concerns.
- Fixed or constrained target allowlists plus DNS resolution/private-network/rebinding checks and deployment egress assumptions.
- Bounded input size, upstream body size, timeouts, and safe HTTP/JSON schema handling.
- Credential lifetime and secure session ownership, especially if inspection/export requires multiple requests.
- WordPress capability checks for intended content, private post exposure policy, per-page pagination/limits and media download safety.
- Safe logging/tracing, no credential leakage, Vercel deployment settings and verified browser-facing HTTPS.
- An export design compatible with Vercel execution and response-size limitations, including partial failures and predictable formats.

These controls are **not implemented** just because this document lists them.

## Scope boundaries

### Implemented

- Connection form, server-side WordPress authentication check with test-host allowlist, and user-facing result message.
- Refactored client modules and automated tests exist on `feature/wordpress-client`.

### Planned

- Strict positive-integer WordPress user ID response validation.
- Explicit error mapping and input/response limits.
- Credential-free demo mode; WordPress content inventory, pagination, preview and export.
- GitHub Actions CI, professional README, Vercel deployment.

### Not decided yet

- Connection/session design for repeated authenticated requests.
- Exact export JSON/media ZIP schema and download approach.
- Public live-connect policy and long-term authentication model.

## Working references

- `AGENTS.md`: agent and Git collaboration rules.
- `docs/roadmap.md`: current task and release gates.
- `src/app/api/wordpress/connect/route.ts`: live code is authoritative; review the current branch.
