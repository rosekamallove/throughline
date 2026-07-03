# Throughline

Scripting & production for YouTube creators. The dashboard is your channel —
you judge every title + thumbnail in-feed, the way a viewer will. Scripts are
written in beats (Hook → Context → Re-hook → Sections → Conclusion) with live
runtime, so you write to a length, not a word count.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 + shadcn/ui · tRPC v11 +
TanStack Query · Drizzle + Postgres · Better Auth (email/pw + Google) · dnd-kit

## Getting started

```bash
pnpm install
pnpm db:up        # local Postgres 16 via docker compose (port 5434)
pnpm db:push      # create the schema
pnpm db:seed      # 9 sample videos + the full Reddit-marketing script
pnpm dev
```

Sign in with `ALLOWED_EMAIL` / `SEED_PASSWORD` from `.env`
(default `rose@groovehq.com` / `throughline-dev`).

## Google sign-in (optional until the YouTube sync)

1. Google Cloud Console → create an OAuth client (web).
2. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   (+ the production URL later).
3. Set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env`.

Google is requested with `accessType: "offline"` so the refresh token lands in
the `account` table from the first sign-in — that token is the substrate for
the v1.1 YouTube import (videos, views, CTR). Only `ALLOWED_EMAIL` can create
an account; everyone else gets "Private beta".

## Theming

All theming lives in `src/app/globals.css`: raw palettes per `data-theme`
(`yt-dark`, `yt-light`) → shadcn semantic tokens → `@theme inline` utilities.
Components use semantic tokens only — never `dark:` variants or raw hex.
A future "minimal" theme is a new palette block plus a `shell` branch in
`src/lib/themes.ts` / `AppShell`.

## Commands

| Command | What |
| --- | --- |
| `pnpm dev` / `pnpm build` | dev server / production build |
| `pnpm typecheck` / `pnpm lint` / `pnpm test` | checks |
| `pnpm db:push` | sync schema while iterating locally |
| `pnpm db:generate` / `db:migrate` | real migrations (do this before first prod deploy) |
| `pnpm db:seed` | idempotent reseed (deterministic IDs — URLs survive) |
| `pnpm db:studio` | Drizzle Studio |

## Before first deploy (Neon + Vercel)

1. `pnpm db:generate` to cut migrations from the current schema, commit them.
2. Neon: create project, use the **pooled** connection string as `DATABASE_URL`.
3. Vercel env: `DATABASE_URL`, `BETTER_AUTH_SECRET` (fresh random),
   `BETTER_AUTH_URL` (prod URL), `ALLOWED_EMAIL`, Google keys.
4. Add the prod Google redirect URI.
