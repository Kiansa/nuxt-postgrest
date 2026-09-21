# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## What this is

A Nuxt module (`nuxt-postgrest`) that wraps `@supabase/postgrest-js` to give Nuxt apps typed PostgREST clients, SSR-aware composables, and auth-aware JWT forwarding — without requiring Supabase hosting.

## Commands

```bash
pnpm db:up            # start local Postgres + PostgREST (docker-compose) — required for tests
pnpm db:down          # stop and wipe the local database
pnpm dev              # playground app with live-reloading, at localhost:3000

pnpm lint             # eslint .
pnpm test             # unit + e2e (needs pnpm db:up)
pnpm test:unit        # vitest --project unit only (no PostgREST needed)
pnpm test:e2e         # vitest --project e2e only (needs pnpm db:up)
pnpm test:watch       # vitest watch
pnpm test:types       # compile-time checks in playground/ and test/fixtures/basic/
```

To run a single test file: `vitest run test/unit/createPostgrestClient.test.ts` (or any path under `test/e2e/`). CI runs the same checks against both Nuxt 3 and Nuxt 4.

Before opening a PR: `pnpm lint`, `pnpm test`, `pnpm test:types` (see CONTRIBUTING.md).

## Architecture

```
src/module.ts                module definition, runtime config, type-gen hook
src/runtime/shared/          createPostgrestClient — the one place a PostgrestClient is constructed
src/runtime/app/             usePostgrest + auth adapters (client & SSR)
src/runtime/server/          usePostgrestUser, usePostgrestAdmin + auth adapters (Nitro only)
playground/                  manual testing app — full login flow, RLS, admin & schema examples
test/unit/                   pure-logic tests (no PostgREST needed)
test/e2e/                    @nuxt/test-utils tests against test/fixtures/basic, real PostgREST
docs/                        Docus documentation site (separate pnpm workspace package)
db/seed.sql, docker-compose.yml   local PostgREST instance used by dev, tests and CI
```

**Adapter pattern for auth.** The module supports multiple auth providers (currently `nuxt-auth-utils` and `none`) via aliasing, not runtime branching:

- `src/module.ts` sets `nuxt.options.alias['#postgrest-auth/app']` and `['#postgrest-auth/server']` to point at `./runtime/app/auth/<provider>` / `./runtime/server/auth/<provider>` based on the resolved `provider`.
- Only the matching adapter file is ever imported, so apps without a given auth library never bundle references to its auto-imports.
- Every server-side adapter/composable takes an `H3Event` and is async; every app-side one is sync and reads from `#imports` composables directly (client + SSR).

To add a new auth provider (full steps in CONTRIBUTING.md): add its id to `AuthProvider` in `src/module.ts`, add `src/runtime/app/auth/<provider>.ts` exporting `getAccessToken(tokenKey)`, add `src/runtime/server/auth/<provider>.ts` exporting `getAccessToken(event, tokenKey)`, wire detection into the `hasNuxtModule(...)` chain in `setup()`, and document it under `docs/content/2.guide/3.authentication.md`.

**Client construction funnels through one function.** `src/runtime/shared/createPostgrestClient.ts` is the only place a `PostgrestClient` gets built; `usePostgrest`, `usePostgrestUser`, and `usePostgrestAdmin` are all thin wrappers around it that differ only in *which token* they resolve and *where* (client/SSR app context vs. Nitro server routes vs. a cached admin singleton).

**Token resolution order** (`usePostgrest` / `usePostgrestUser`): explicit `options.token` → session token via the active auth adapter → public anon key from module config → no `Authorization` header. `usePostgrestAdmin` instead always uses the server-only `NUXT_POSTGREST_SECRET_KEY` and bypasses RLS if that role does; its client is memoized as a module-level singleton.

**Database types.** Types come from a generated `Database` type file (default path `~~/shared/types/database.types.ts`), re-exported through a Nitro template at `#build/types/postgrest-database`. If `types.generate` is enabled, `module.ts`'s `generateTypes()` shells out to the Supabase CLI (`npx supabase gen types typescript --db-url ...`) on `nuxt dev`/`nuxt prepare` (never on build), gated on `NUXT_POSTGREST_DB_URI` being set and Docker running. It uses `execFileSync` (not a shell string) specifically so the connection URI can't be used for command injection — preserve that when touching this code. A failed/partial generation never overwrites the existing types file.

**Schema handling.** `SchemaKeys<DB>`/`DefaultSchema<DB>` in `createPostgrestClient.ts` derive the available Postgres schemas (and default to `'public'`) directly from the generated `Database` type, so multi-schema and per-tenant clients (via `createPostgrestClient<Database, 'schema_name'>(...)`) stay fully typed.

## Testing notes

- `test/unit/` needs no live services.
- `test/e2e/` and the `playground/` both run against real Postgres + PostgREST started by `pnpm db:up` (see `docker-compose.yml`, seeded by `db/seed.sql`). e2e tests build/mount `test/fixtures/basic`, a minimal Nuxt app with a login route, an admin route, and RLS-scoped `me/*` routes exercising each composable.
- `pnpm pretest` runs `nuxt prepare test/fixtures/basic` automatically before `vitest run`.
