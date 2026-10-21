# SiteLift

Import structured content from an API, transform it into a consistent model, and inspect it before moving it to another website or CMS.

**Implemented: MVP Slice 1, import and preview.** JSON/CSV export, `/case-study`, CI and public deployment are later slices. This branch has not been deployed.

## Try it locally

Use Node.js 22.12+ (or a newer supported LTS release) and pnpm 11.5.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000), choose a source and select **Import content**. No environment variables or credentials are needed for this slice.

- **Sample collection:** six deterministic bundled articles, independent of external API availability. Sample mode still needs the running SiteLift server.
- **JSONPlaceholder:** a live request to a public API containing synthetic example posts. The UI distinguishes a live response from bundled samples; neither is presented as real editorial content.

Inspect the readable record, normalized JSON and field mapping. Filter the imported collection and select a record to review it. Imported text remains inert: HTML and scripts are never rendered as markup. A failed live request shows an error and an explicit sample option, with no automatic substitution.

Imports exist only in request/browser memory. Refreshing the page clears the preview. There are no accounts, saved imports, credentials or database for this workflow.

## Checks

```sh
pnpm test:ci
pnpm lint
pnpm build
```

`pnpm test` runs Vitest in watch mode. Tests use synthetic fixtures and injected/mocked `fetch`; Vitest disables `.env` file loading. Next.js itself loads local environment files normally during development and builds. The existing Geist font configuration may require Google Fonts access for a production build.

Tests cover normalization, invalid/duplicate records, empty results, source restrictions, streamed byte limits, timeouts, route responses and safe text rendering. Browser interaction checks for Slice 1 are documented in the PR; they are not a committed browser-test suite.

## Architecture and limits

- Next.js App Router, React, strict TypeScript and CSS; no UI framework or runtime dependency added for the importer.
- `POST /api/import` accepts only `{ "source": "sample" | "jsonplaceholder", "limit": 1..24 }` as JSON. It rejects unknown fields, including URL overrides.
- The only outbound content endpoint is `https://jsonplaceholder.typicode.com/posts?_limit=<limit>`. Redirects are refused, caching is disabled and the upstream deadline is 10 seconds, including body reading.
- Incoming JSON is limited to 1 KiB and five seconds; upstream decoded body bytes are limited to 256 KiB. Records are validated before normalization. The entire batch fails if a record is invalid; data is not silently dropped.
- Schema v1 defines stable source identities, title, slug, plain-text body and nullable metadata. Generated slugs are suggestions, not guaranteed unique destination URLs.

See [architecture](docs/architecture.md) for the schema and extension points, and [roadmap](docs/roadmap.md) for remaining slices.

## Source choice

[JSONPlaceholder](https://jsonplaceholder.typicode.com/) provides keyless public REST endpoints and a simple post structure (`id`, `userId`, `title`, `body`) relevant to a CMS migration. It lets the demo exercise actual HTTP requests and data validation without an account. It is a third-party service without an availability guarantee; samples keep SiteLift demonstrable when it fails. Its posts do not supply publication dates, media or real author names, so SiteLift does not invent them.

## Before public deployment

Slice 4 must review admission/rate controls and Vercel configuration. The older WordPress connection prototype remains in the repository but is not part of the workbench. **Do not deploy that credential endpoint unrestricted.** The separate `feature/wordpress-client` work is preserved for later review and has not been merged into this feature. Deployment, exports and the case study are intentionally outside Slice 1.
