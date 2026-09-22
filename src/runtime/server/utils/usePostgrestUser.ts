import type { H3Event } from 'h3'
import type { PostgrestClient } from '@supabase/postgrest-js'
import { createPostgrestClient } from '../../shared/utils/createPostgrestClient'
import { getAccessToken } from '#postgrest-token/server'
import { useRuntimeConfig } from '#imports'
import type { Database } from '#build/types/postgrest-database'

export interface UsePostgrestUserOptions {
  /** Explicit JWT. Takes precedence over the session token and the anon key. */
  token?: string
  /** Extra headers merged into every request. */
  headers?: Record<string, string>
}

/**
 * PostgREST client acting as the requesting user, for Nitro server routes.
 * Row-level security applies as that user.
 *
 * Token resolution: `options.token` → session token (nuxt-auth-utils, if installed) → public anon key → no header.
 */
export async function usePostgrestUser(event: H3Event, options: UsePostgrestUserOptions = {}): Promise<PostgrestClient<Database>> {
  const { url, key, tokenKey } = useRuntimeConfig(event).public.postgrest

  if (!url) {
    throw new Error('[nuxt-postgrest] Missing PostgREST URL. Set `postgrest.url` or NUXT_PUBLIC_POSTGREST_URL.')
  }

  const token = options.token || await getAccessToken(event, tokenKey)

  return createPostgrestClient<Database>({
    url,
    key: token || key || undefined,
    headers: options.headers,
  }) as PostgrestClient<Database>
}
