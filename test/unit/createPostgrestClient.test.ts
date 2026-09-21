import { describe, expect, it } from 'vitest'
import { createPostgrestClient } from '../../src/runtime/shared/createPostgrestClient'

describe('createPostgrestClient', () => {
  it('requires a url', () => {
    expect(() => createPostgrestClient({ url: '' })).toThrow('`url` is required')
  })

  it('sets the bearer token when a key is given', () => {
    const client = createPostgrestClient({ url: 'http://localhost:3001', key: 'jwt' })
    expect(new Headers(client.headers).get('authorization')).toBe('Bearer jwt')
  })

  it('omits Authorization without a key so PostgREST uses its anon role', () => {
    const client = createPostgrestClient({ url: 'http://localhost:3001' })
    expect(new Headers(client.headers).has('authorization')).toBe(false)
  })

  it('lets explicit headers override defaults', () => {
    const client = createPostgrestClient({ url: 'http://x', key: 'a', headers: { 'Authorization': 'Bearer b', 'x-tenant': 't1' } })
    const headers = new Headers(client.headers)
    expect(headers.get('authorization')).toBe('Bearer b')
    expect(headers.get('x-tenant')).toBe('t1')
  })

  it('passes the schema through', () => {
    const client = createPostgrestClient({ url: 'http://x', schema: 'internal' })
    expect(client.schemaName).toBe('internal')
  })

  it('uses the custom fetch', async () => {
    const calls: string[] = []
    const client = createPostgrestClient({
      url: 'http://x',
      fetch: (async (input: RequestInfo | URL) => {
        calls.push(String(input))
        return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } })
      }) as typeof fetch,
    })
    await client.from('todos').select('id')
    expect(calls[0]).toContain('http://x/todos?select=id')
  })
})
