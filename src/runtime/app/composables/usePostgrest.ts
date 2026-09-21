import type { PostgrestClient } from '@supabase/postgrest-js'
import { createPostgrestClient } from '../../shared/createPostgrestClient'
import { getAccessToken } from '#postgrest-auth/app'
import { useRuntimeConfig } from '#imports'
import type { Database } from '#build/types/postgrest-database'

export interface UsePostgrestOptions {
  /** Explicit JWT. Takes precedence over the session token and the anon key. */
  token?: string
  /** Extra headers merged into every request. */
  headers?: Record<string, string>
}

/**
 * PostgREST client for the current user, usable in components, pages and plugins (client + SSR).
 *
 * Token resolution: `options.token` → session token (auth provider) → public anon key → no header.
 */
export function usePostgrest(options: UsePostgrestOptions = {}): PostgrestClient<Database> {
  const { url, key, schema, tokenKey } = useRuntimeConfig().public.postgrest

  if (!url) {
    throw new Error('[nuxt-postgrest] Missing PostgREST URL. Set `postgrest.url` or NUXT_PUBLIC_POSTGREST_URL.')
  }

  return createPostgrestClient<Database>({
    url,
    key: options.token || getAccessToken(tokenKey) || key || undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema: schema as any,
    headers: options.headers,
  }) as PostgrestClient<Database>
}
