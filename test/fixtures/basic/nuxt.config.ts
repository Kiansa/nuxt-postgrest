import NuxtPostgrest from '../../../src/module'

export default defineNuxtConfig({
  modules: ['nuxt-auth-utils', NuxtPostgrest],
  runtimeConfig: {
    postgrest: {
      secretKey: process.env.NUXT_POSTGREST_SECRET_KEY || '',
    },
    session: {
      password: 'test-session-password-that-is-long-enough-32',
    },
  },
  compatibilityDate: 'latest',
  postgrest: {
    url: process.env.POSTGREST_URL || 'http://localhost:3001',
  },
})
