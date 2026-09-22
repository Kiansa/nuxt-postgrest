export default defineNuxtConfig({
  modules: ['nuxt-auth-utils', 'nuxt-postgrest'],
  devtools: { enabled: true },
  compatibilityDate: 'latest',
  postgrest: {
    // Matches docker-compose.postgrest.yml. Override with NUXT_PUBLIC_POSTGREST_URL.
    url: 'http://localhost:3001',
  },
})
