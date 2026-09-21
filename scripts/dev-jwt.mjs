// Usage: node scripts/dev-jwt.mjs <role> [sub]
// Prints a JWT signed with the docker-compose dev secret.
import { createHmac } from 'node:crypto'

const [role = 'service_role', sub] = process.argv.slice(2)
const secret = process.env.PGRST_JWT_SECRET || 'nuxt-postgrest-dev-secret-at-least-32-chars-long'
const b64 = s => Buffer.from(s).toString('base64url')
const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
const payload = b64(JSON.stringify({ role, ...(sub ? { sub } : {}) }))
const sig = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
console.log(`${header}.${payload}.${sig}`)
