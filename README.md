# Pawster
HIIIIII -sarah

Pawster is a foster portal for coordinating pet placements, weekly foster updates, supply requests, and future integrations with external shelter systems. The central domain entity is a `placement`, which represents a pet assigned to a foster for a period of time.

This repository is intentionally set up as a simple single-app Next.js project. API routes, server-side domain helpers, Supabase access, and UI live together in one application.

## Tech Stack

- Next.js App Router
- TypeScript
- Supabase PostgreSQL, Auth, and Storage
- `@supabase/supabase-js`
- `@supabase/ssr`
- `zod`

## Local Setup

Install dependencies:

```bash
npm install
```

Copy the example environment file and fill in local Supabase values:

```bash
cp .env.example .env.local
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Required Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Do not commit real secrets to Git.

## Project Structure

```text
src/
  app/
    api/
      placements/
      weekly-updates/
      supply-requests/
      integrations/
        shelterluv/
        twilio/
    dashboard/
    login/
  components/
    ui/
    forms/
    layout/
  lib/
    supabase/
    auth/
    placements/
    weekly-updates/
    supplies/
    integrations/
      shelterluv/
      twilio/
      email/
  types/
supabase/
  migrations/
tests/
```

## Database Changes

Use SQL migrations under `supabase/migrations` for schema changes. The initial migration creates profiles, pets, placements, weekly updates, and weekly update photos. RLS policies are not implemented yet.

## Integrations

Shelterluv, Twilio, and email integration code should stay isolated under `src/lib/integrations`. They are placeholders for now and should not introduce infrastructure dependencies until the integration boundaries are designed.

## Quality Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```
