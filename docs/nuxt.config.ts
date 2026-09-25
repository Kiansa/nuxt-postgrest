const url = process.env.NUXT_SITE_URL || 'https://kiansa.github.io/nuxt-postgrest/'

export default defineNuxtConfig({
  extends: ['docus'],
  // Derived from `url` so this is `/` once a root custom domain replaces the
  // default GitHub Pages project URL, with no path segment to strip.
  app: {
    baseURL: new URL(url).pathname,
  },
  site: {
    name: 'Nuxt PostgREST',
    url,
  },
  llms: {
    domain: url,
    title: 'Nuxt PostgREST',
    description: 'First-class PostgREST for Nuxt: typed clients, SSR-aware composables and auth-aware JWT forwarding.',
  },
})
