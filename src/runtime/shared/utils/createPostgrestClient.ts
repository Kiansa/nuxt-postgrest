import { PostgrestClient } from '@supabase/postgrest-js'
import type { Database } from '#build/types/postgrest-database'

type SchemaKeys<DB> = string & keyof Omit<DB, '__InternalSupabase'>

type DefaultSchema<DB> = 'public' extends SchemaKeys<DB> ? 'public' : SchemaKeys<DB>

type ClientOptionsOf<DB> = DB extends { __InternalSupabase: infer I extends { PostgrestVersion?: string } } ? I : {} // eslint-disable-line @typescript-eslint/no-empty-object-type

export interface CreatePostgrestClientOptions<SchemaName extends string = string> {
  /** PostgREST API URL */
  url: string
  /** JWT sent as `Authorization: Bearer <key>`. Omit to hit PostgREST as its anon role. */
  key?: string
  /** Postgres schema to target (sets `Accept-Profile` / `Content-Profile`). */
  schema?: SchemaName
  /** Extra headers merged into every request. */
  headers?: Record<string, string>
  /** Custom fetch implementation. */
  fetch?: typeof fetch
  /** Request timeout in milliseconds. */
  timeout?: number
}

/**
 * Create a typed PostgREST client with explicit connection parameters.
 * Useful for multi-tenant / db-per-tenant setups or non-default schemas.
 *
 * @example
 * const auth = createPostgrestClient<Database, 'auth'>({ url, key, schema: 'auth' })
 */
export function createPostgrestClient<
  DB = Database,
  SchemaName extends SchemaKeys<DB> = DefaultSchema<DB>,
>(options: CreatePostgrestClientOptions<SchemaName>): PostgrestClient<DB, ClientOptionsOf<DB>, SchemaName> {
  const { url, key, schema, headers = {}, fetch, timeout } = options

  if (!url) {
    throw new Error('[nuxt-postgrest] `url` is required')
  }

  return new PostgrestClient<DB, ClientOptionsOf<DB>, SchemaName>(url, {
    headers: {
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
      ...headers,
    },
    schema,
    fetch,
    timeout,
  })
}
