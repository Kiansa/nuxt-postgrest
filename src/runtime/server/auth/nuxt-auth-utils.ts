import type { H3Event } from 'h3'
// `getUserSession` only exists in Nitro's #imports. Nuxt also type-checks Nitro utils in the app
// context, where it's missing, so the check is suppressed here. Server type-checks still cover it.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getUserSession } from '#imports'

export async function getAccessToken(event: H3Event, tokenKey: string): Promise<string | undefined> {
  const session = await getUserSession(event) as Record<string, unknown> & { secure?: Record<string, unknown> }
  // Prefer the server-only `secure` field, fall back to the public session field
  const value = session?.secure?.[tokenKey] ?? session?.[tokenKey]
  return typeof value === 'string' ? value : undefined
}
