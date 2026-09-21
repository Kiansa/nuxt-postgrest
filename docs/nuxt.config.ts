const url = process.env.NUXT_SITE_URL || 'https://YOUR_DOCS_URL'

export default defineNuxtConfig({
  extends: ['docus'],
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
