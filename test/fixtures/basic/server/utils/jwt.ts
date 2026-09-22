import { createHmac } from 'node:crypto'

// Must match PGRST_JWT_SECRET in docker-compose.postgrest.yml. Dev only.
const DEV_SECRET = 'nuxt-postgrest-dev-secret-at-least-32-chars-long'

const b64 = (input: string | Buffer) => Buffer.from(input).toString('base64url')

export function signDevJwt(claims: Record<string, unknown>, secret = DEV_SECRET) {
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, ...claims }))
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}
