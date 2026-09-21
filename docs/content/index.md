---
seo:
  title: Nuxt PostgREST
  description: First-class PostgREST for Nuxt. Typed clients, SSR-aware composables and auth-aware JWT forwarding. No Supabase required.
---

::u-page-hero
#title
PostgREST, the Nuxt way

#description
Typed clients, SSR-aware composables and automatic JWT forwarding for any self-hosted PostgREST. No Supabase required.

#links
  :::u-button
  ---
  size: xl
  to: /getting-started/installation
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::u-button
  ---
  color: neutral
  icon: i-simple-icons-github
  size: xl
  to: https://github.com/YOUR_GH_USER/nuxt-postgrest
  variant: outline
  ---
  Star on GitHub
  :::
::

::u-page-section
#features
  :::u-page-feature
  ---
  icon: i-lucide-shield-check
  ---
  #title
  Row-level security, as the user

  #description
  `usePostgrest()` and `usePostgrestUser()` forward the logged-in user's JWT, so Postgres RLS does the authorization.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-braces
  ---
  #title
  End-to-end types

  #description
  Point the module at your generated `Database` type and every table, column and schema is checked at compile time.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-server
  ---
  #title
  SSR and Nitro ready

  #description
  One client for components, pages and server routes, with a server-only admin client for privileged work.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-key-round
  ---
  #title
  Auth integration

  #description
  Reads tokens from `nuxt-auth-utils` sessions automatically, or pass any JWT from the auth library you already use.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-layers
  ---
  #title
  Schemas and tenants

  #description
  Switch Postgres schemas with `.schema()` or build per-tenant clients with `createPostgrestClient()`.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-feather
  ---
  #title
  Thin by design

  #description
  Built on the battle-tested `@supabase/postgrest-js` query builder. Nothing to learn beyond PostgREST itself.
  :::
::
