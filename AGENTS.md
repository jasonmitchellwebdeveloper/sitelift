<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## SiteLift project guidance

These are shared engineering instructions for Codex and contributors. Keep the Next.js-generated rules above intact; the development server may regenerate that marked block.

### Product and source of truth

SiteLift is a portfolio-quality application for connecting to WordPress, inspecting posts/pages/media, and exporting usable content. The public version is intended for Vercel, with a credential-free demo suitable for potential employers.

- Stack: Next.js 16 App Router, React 19, TypeScript (strict), Node.js route handlers, pnpm. Prefer native platform features and the current stack; justify dependencies.
- Read `docs/architecture.md` and `docs/roadmap.md` before substantial work. Confirm current branch, code, and tests rather than assuming docs are current.
- The currently working app is a **connection-check prototype**. Inspection, export, demo mode, and public deployment are not yet implemented.
- `feature/wordpress-client` holds the Vitest setup and refactored authentication modules; they are not yet on `main`. These docs can land independently on `main`.

### Collaboration

- Act as an engineering collaborator, not an unquestioning code generator. Explain consequential trade-offs, challenge insecure decisions, and identify assumptions.
- For a clear, already approved task, implement, add/adjust tests, run checks, then summarize results without requiring a separate chat to relay each step.
- Ask before high-impact architectural/product changes, security exceptions, production deployments, or unclear scopes. Planning-only/read-only requests must not change files.
- Make small, reviewable changes. Avoid speculative abstractions, unnecessary libraries, overly elaborate mocking, and unrelated cleanup.
- Do not overwrite unrelated changes. Never claim a check passed, a deployment succeeded, or a review was completed without verifying it.
- Use clean, readable code, minimal comments, and ordinary hyphens in project documentation.

### Security requirements

- Treat user input, WordPress URLs, Application Passwords, WordPress responses and media as untrusted.
- Never put secrets in Git, test fixtures, query strings, logs, telemetry, public errors or committed `.env` files. Use synthetic credentials in tests.
- Keep WordPress credentials server-side for upstream calls; design their lifecycle explicitly before inspection/export. Do not add persistence by default.
- Until a separately reviewed design supersedes it, keep the exact configured hostname allowlist, upstream HTTPS, rejection of URL credentials/query/fragment/unexpected ports, preserved subdirectory paths, manual redirects, `no-store`, and a bounded request timeout.
- The allowlist does not eliminate SSRF or DNS/private-network risks. Do not open this server-side connector to arbitrary hosts without explicit security review.
- A structurally valid WordPress user response is not authorization to export content. Check permissions and content visibility independently.
- Do **not** expose the current live connection endpoint on an unrestricted public Vercel deployment. First address admission/access controls, rate limiting, input/response size bounds, environment and logging safeguards. Demo visitors should never need their own WordPress credentials.
- Do not connect to real WordPress hosts in automated tests or load `.env.local` in CI.

### Testing and Git

- Use `pnpm`. Follow the version-specific Next.js documentation rule above before changing Next.js APIs.
- On branches with the test harness, run `pnpm test:ci`, `pnpm lint`, and `pnpm build` when practical; report any skipped checks and why. A production build may require network access for existing Google Fonts.
- Prefer focused Vitest tests with synthetic fixtures and mocked/injected `fetch`. Explicitly update characterization tests when intentionally changing behaviour.
- Branch naming: `feature/*`, `fix/*`, `test/*`, `docs/*`. Never push directly to `main`.
- Open PRs for review against `main` unless intentionally coordinating a stacked PR. Include summary, tests, security implications and any manual verification.
- Never force-push protected branches, bypass protections, or merge a PR without the repository owner's explicit approval. Assign PRs to the owner for review when supported.
- Do not commit or push when a task explicitly says not to.

### Work continuation

- Check `docs/roadmap.md` for the next approved slice; inspect the real implementation before editing.
- Prefer moving forward within VS Code/Codex rather than making the human copy code and plans between AI chats. The ChatGPT conversation can independently review GitHub PRs and architectural decisions.
- Keep `docs/architecture.md` and `docs/roadmap.md` accurate when a PR changes architecture or milestone status.
