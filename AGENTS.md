<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Pawster Project Notes

- Pawster is a Next.js App Router project using TypeScript and Supabase.
- Supabase provides PostgreSQL, Auth, and Storage for the single-app architecture.
- Keep code feature-oriented under `src/lib`, with shared UI in `src/components`.
- Use `supabase/migrations` for schema changes; do not change production schema by hand.
- Never commit secrets. Keep local values in `.env.local` and document examples in `.env.example`.
- Do not push directly to `main`; use branches and reviewable pull requests.
- Keep third-party integrations isolated under `src/lib/integrations`.
- Treat `placement` as the central domain entity: a pet assigned to a foster for a period of time.
- Authorization must eventually be enforced server-side and/or through Supabase RLS.
