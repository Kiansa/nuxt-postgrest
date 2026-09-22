import type { PostgrestClient } from '@supabase/postgrest-js'
import { createPostgrestClient } from '../../shared/utils/createPostgrestClient'
import { getAccessToken } from '#postgrest-token/app'
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
 * Token resolution: `options.token` → session token (nuxt-auth-utils, if installed) → public anon key → no header.
 */
export function usePostgrest(options: UsePostgrestOptions = {}): PostgrestClient<Database> {
  const { url, key, tokenKey } = useRuntimeConfig().public.postgrest

  if (!url) {
    throw new Error('[nuxt-postgrest] Missing PostgREST URL. Set `postgrest.url` or NUXT_PUBLIC_POSTGREST_URL.')
  }

  return createPostgrestClient<Database>({
    url,
    key: options.token || getAccessToken(tokenKey) || key || undefined,
    headers: options.headers,
  }) as PostgrestClient<Database>
}
