import { useUserSession } from '#imports'

export function getAccessToken(tokenKey: string): string | undefined {
  // Client-visible session data. Tokens stored under `secure` are server-only by design.
  const { session } = useUserSession()
  const value = (session.value as Record<string, unknown> | null | undefined)?.[tokenKey]
  return typeof value === 'string' ? value : undefined
}
