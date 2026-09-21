# Contributing

## Setup

```bash
git clone https://github.com/Kiansa/nuxt-postgrest
cd nuxt-postgrest
pnpm install
pnpm db:up          # Postgres + PostgREST via docker-compose
pnpm dev             # playground with your changes, live-reloading
```

`pnpm db:down` stops and wipes the local database.

## Checks before opening a PR

```bash
pnpm lint
pnpm test        # unit + e2e — needs `pnpm db:up` running
pnpm test:types  # compile-time checks in playground/ and test/fixtures/basic/
```

CI runs the same checks against both Nuxt 3 and Nuxt 4.

## Project layout

```
src/module.ts              module definition, runtime config, type-gen hook
src/runtime/shared/         createPostgrestClient — the one place a PostgrestClient is built
src/runtime/app/            usePostgrest + auth adapters (client & SSR)
src/runtime/server/         usePostgrestUser, usePostgrestAdmin + auth adapters (Nitro only)
playground/                 manual testing app — a full login flow, RLS, admin & schema examples
test/unit/                  pure-logic tests (no PostgREST needed)
test/e2e/                   @nuxt/test-utils tests against test/fixtures/basic, real PostgREST
docs/                       Docus documentation site
db/seed.sql, docker-compose.yml   local PostgREST used by dev, tests and CI
```

## Adding an auth provider

Auth is adapter-based so apps without a given library never bundle its imports:

1. Add the provider id to `AuthProvider` in `src/module.ts`.
2. Add `src/runtime/app/auth/<provider>.ts` exporting `getAccessToken(tokenKey): string | undefined`.
3. Add `src/runtime/server/auth/<provider>.ts` exporting `getAccessToken(event, tokenKey): Promise<string | undefined>`.
4. Add detection in the `hasNuxtModule(...)` chain in `setup()`.
5. Document it under `docs/content/2.guide/3.authentication.md`.

## Releasing (maintainers)

```bash
pnpm release
```

Runs lint, tests, the build, bumps the version with `changelogen`, and tags. Pushing the tag triggers `.github/workflows/release.yml`, which publishes to npm via trusted publishing and creates the GitHub release.
