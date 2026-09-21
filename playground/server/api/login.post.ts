import { signDevJwt } from '../utils/jwt'

// Demo only: mint a PostgREST JWT for "alice" and keep it in the session.
export default defineEventHandler(async (event) => {
  const token = signDevJwt({ role: 'authenticated', sub: 'alice' })
  await setUserSession(event, {
    user: { name: 'alice' },
    // Visible to the client so usePostgrest() can call PostgREST directly from the browser.
    // Put it under `secure` instead if you only query from server routes.
    postgrest_token: token,
  })
  return { ok: true }
})
