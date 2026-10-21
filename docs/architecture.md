# SiteLift Architecture

_Last updated: 2026-10-21. Decisions and proposed behaviour are identified separately from the implemented application._

## Product definition

**SiteLift is an API content integration and export tool for website and CMS migration.**

The first release imports structured records from a supported public API, transforms them into a consistent content model, previews them and exports JSON or CSV. The first priority after public release is user-defined API endpoint import with schema inspection and field mapping, subject to a specific network-security design. WordPress and other CMS sources follow, then possibly destination integrations. A general-purpose website scraper/archive is **not** part of the first release.

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

A single good end-to-end source integration is enough to ship the first release. User-defined API endpoints and editable field mapping are the **first major post-launch workstream**; multiple additional connectors, accounts, databases, ZIP packaging and remote destination APIs are later, not MVP blockers.

## Current implementation (Slice 1 on feature/api-import, pending review)

- Next.js 16.4.2 App Router, React 19.3, TypeScript strict, pnpm.
- The home page is an import workbench with source selection, bounded imports, readable/JSON record previews, filtering, a source-to-target mapping and loading/success/empty/error states. Export is visibly marked as coming next.
- `POST /api/import` supports a fixed JSONPlaceholder posts endpoint and six deterministic bundled samples. Live synthetic API results and sample content have separate provenance labels. There is no automatic sample substitution after errors.
- An independent Vitest setup was added from main for this slice. It does not incorporate the WordPress feature branch's implementation or test files.
- The original `POST /api/wordpress/connect` and unused connection form remain unchanged. `feature/wordpress-client` is preserved separately for the later connector. Neither is needed by the new workbench.
- JSON/CSV export, `/case-study`, CI and public Vercel deployment remain planned.

## Slice 1 data flow and responsibilities

```text
Workbench -> POST /api/import -> fixed source fetch or bundled samples
                             -> runtime validation -> normalization
          <- schema v1 records + explicit source provenance
          -> plain-text preview / JSON / mapping
```

- `src/lib/content/model.ts`: shared canonical types, source labels, limits and documented field mapping.
- `src/lib/content/import.ts`: validates the small source/limit request and selects the source. The fixed live endpoint uses injectable fetch; samples bypass outbound networking.
- `src/lib/content/read-json.ts`: reads bounded UTF-8 JSON streams, enforces actual bytes rather than trusting Content-Length, and cancels a stream when its deadline expires.
- `src/lib/content/normalize.ts`: pure runtime record validation and transformation. Extra source fields are discarded; invalid records or duplicate identities fail the batch instead of silently losing data.
- `src/lib/content/errors.ts`: stable internal codes and fixed public messages/statuses. Raw body content and original exceptions are never attached to public failures.
- `src/app/api/import/route.ts`: JSON request/response handling, ingress bounds and HTTP errors.
- `src/components/ImportWorkbench.tsx`: in-memory import state and interaction; `ContentPreview.tsx` renders strings using React text escaping. Imported content never enters `dangerouslySetInnerHTML`.

The server-only marker protects import/network modules. Vitest aliases the marker only in its own configuration and disables environment-file loading. No runtime packages, infrastructure, storage or sessions are added. Vitest is the only direct development dependency added for this slice.

There are two explicit source branches, rather than a connector framework. Both currently produce the same post shape. A future provider can supply its own validator/normalizer and return the existing `ImportResult`; the UI need not know its raw schema. Add a shared adapter interface only when a real connector needs it.

## Canonical schema v1

An import result contains `schemaVersion: 1`, `source: { id, label, kind }` and `records`. Source kind is `live` or `sample`; it describes retrieval, not whether editorial content is real. JSONPlaceholder itself serves synthetic example content.

| Record field | Meaning and missing-value policy |
| --- | --- |
| `id` | Namespaced stable identity, such as `jsonplaceholder:7` or `sample:7`. |
| `sourceRecordId` | Positive safe integer source ID converted to a string. |
| `title` | Required nonempty trimmed string; source field capped at 500 characters. |
| `slug` | Derived lowercase ASCII text, capped at 80 characters; `record-<source ID>` when no ASCII text remains. Not guaranteed unique. |
| `body` | Required string; source field capped at 20,000 characters. CRLF/CR become LF and outer whitespace is trimmed. Empty body remains empty. |
| `bodyFormat` | Always `plain-text` in Slice 1. Source HTML is displayed literally. |
| `authorId` | Stringified positive safe integer, or `null` when absent/null. Invalid supplied IDs reject the record. |
| `sourceUrl` | Fixed provider resource URL built from the validated numeric ID; `null` for samples. Never taken from untrusted URL fields. |

Source order is retained. No publication dates, media or author names are fabricated. Slugs are preview metadata, not destination routes. Exports can later serialize this versioned result without revisiting source fetching.

## Source decision and bounds

[JSONPlaceholder](https://jsonplaceholder.typicode.com/) is a simple public REST API without signup or keys. Its post identity, author ID, title and body are enough to demonstrate migration-style modelling. A checked live request confirmed the `_limit` parameter. Its data is synthetic and it supplies no uptime guarantee; bundled samples keep the demonstration usable without the external service.

- Request: only `source` (`sample` or `jsonplaceholder`) and integer `limit` (1-24); unknown keys are rejected, with no URL override.
- Only outbound endpoint: HTTPS `jsonplaceholder.typicode.com/posts`, with server-built `_limit`. GET, `redirect: manual`, `cache: no-store`; no caller headers or credentials forwarded.
- Request JSON: maximum 1 KiB, five-second read deadline. Upstream JSON: maximum 256 KiB of decoded body bytes, ten-second deadline including streaming. Vercel route duration: 20 seconds.
- JSON Content-Type is required. Actual streamed bytes and record counts are checked even when response headers lie. An oversized or invalid response fails safely.
- HTTP errors: 400 invalid requests, 408 ingress timeout, 413 oversized requests, 502 upstream HTTP/network/schema/size failures, 504 upstream timeout, 500 unexpected failures. All responses carry `Cache-Control: no-store`.
- No persistence, authentication, or rate-limiting infrastructure. Public deployment still requires the security gates below; bounds alone are not admission control.

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
