import { signDevJwt } from '../utils/jwt'

// ?where=secure → token only on the server; default → client-visible session field
export default defineEventHandler(async (event) => {
  const { as = 'alice', where } = getQuery(event) as { as?: string, where?: string }
  const token = signDevJwt({ role: 'authenticated', sub: as })
  await setUserSession(event, where === 'secure'
    ? { user: { name: as }, secure: { postgrest_token: token } }
    : { user: { name: as }, postgrest_token: token })
  return { ok: true }
})
