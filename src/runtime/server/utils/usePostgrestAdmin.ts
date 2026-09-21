import type { PostgrestClient } from '@supabase/postgrest-js'
import { createPostgrestClient } from '../../shared/createPostgrestClient'
import { useRuntimeConfig } from '#imports'
import type { Database } from '#build/types/postgrest-database'

let adminClient: PostgrestClient<Database> | undefined

/**
 * Privileged PostgREST client using the server-only secret JWT. Server routes only.
 * Bypasses row-level security if the secret's role does. Use `.schema('name')` to switch schemas.
 */
export function usePostgrestAdmin(): PostgrestClient<Database> {
  if (adminClient) return adminClient

  const config = useRuntimeConfig()
  const { url, schema } = config.public.postgrest
  const { secretKey } = config.postgrest

  if (!url) {
    throw new Error('[nuxt-postgrest] Missing PostgREST URL. Set `postgrest.url` or NUXT_PUBLIC_POSTGREST_URL.')
  }
  if (!secretKey) {
    throw new Error('[nuxt-postgrest] Missing NUXT_POSTGREST_SECRET_KEY for admin access.')
  }

  adminClient = createPostgrestClient<Database>({
    url,
    key: secretKey,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema: schema as any,
  }) as PostgrestClient<Database>
  return adminClient
}
