import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  addImports,
  addServerImports,
  addTemplate,
  createResolver,
  defineNuxtModule,
  hasNuxtModule,
  resolvePath,
  useLogger,
} from '@nuxt/kit'
import { defu } from 'defu'

const logger = useLogger('nuxt-postgrest')

export interface ModuleOptions {
  /**
   * PostgREST API URL. Override at runtime with `NUXT_PUBLIC_POSTGREST_URL`.
   */
  url?: string
  /**
   * Public anon JWT sent when no user token is available. Override at runtime with `NUXT_PUBLIC_POSTGREST_KEY`.
   * Leave empty to let PostgREST use its `db-anon-role` without an Authorization header.
   */
  key?: string
  /**
   * Session field holding the PostgREST JWT. Only read when `nuxt-auth-utils` is installed
   * (auto-detected) — otherwise pass a token explicitly to `usePostgrest`/`usePostgrestUser`.
   * @default 'postgrest_token'
   */
  tokenKey?: string
  /**
   * Generate the `Database` type file with the Supabase CLI on `nuxt dev` / `nuxt prepare`.
   * Requires `NUXT_POSTGREST_DB_URI` and a running Docker daemon. Never runs during `nuxt build`.
   * @default false
   */
  generateTypes?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-postgrest',
    configKey: 'postgrest',
    compatibility: {
      nuxt: '>=4.0.0',
    },
  },
  defaults: {
    url: '',
    key: '',
    tokenKey: 'postgrest_token',
    generateTypes: false,
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // --- Runtime config ------------------------------------------------------
    nuxt.options.runtimeConfig.public.postgrest = defu(
      nuxt.options.runtimeConfig.public.postgrest as Record<string, unknown> | undefined,
      {
        url: options.url || '',
        key: options.key || '',
        tokenKey: options.tokenKey || 'postgrest_token',
      },
    )
    nuxt.options.runtimeConfig.postgrest = defu(
      nuxt.options.runtimeConfig.postgrest as Record<string, unknown> | undefined,
      { secretKey: '' },
    )

    // --- Database types ------------------------------------------------------
    const typesPath = await resolvePath('~~/shared/types/database.types.ts')
    const shouldGenerate = options.generateTypes
      && (nuxt.options.dev || nuxt.options._prepare)
      && !nuxt.options.test

    if (shouldGenerate) {
      // Runs before templates are rendered, so the type template below sees the fresh file
      nuxt.hook('modules:done', () => {
        generateTypes(typesPath)
      })
    }

    addTemplate({
      filename: 'types/postgrest-database.d.ts',
      write: true,
      getContents: () => existsSync(typesPath)
        ? `export type { Database } from '${typesPath.replace(/(\.d)?\.ts$/, '')}'\n`
        : `// No types found at ${typesPath}. See https://github.com/Kiansa/nuxt-postgrest#types\nexport type Database = any\n`,
    })

    // --- Token resolution ------------------------------------------------------
    // nuxt-auth-utils is the one auth library this module knows about, and only when it's
    // actually installed — detected once, here, at build time. Apps without it never get a
    // reference to its composables (which don't exist for them) baked into their bundle.
    // Any other auth library: read the token yourself and pass it to usePostgrest/usePostgrestUser.
    const hasAuthUtils = hasNuxtModule('nuxt-auth-utils', nuxt)
    if (hasAuthUtils) {
      logger.debug('nuxt-auth-utils detected — reading the PostgREST JWT from its session automatically')
    }

    addTemplate({
      filename: 'postgrest-token-app.ts',
      write: true,
      getContents: () => hasAuthUtils
        ? `import { useUserSession } from '#imports'

// Client-visible session data. Tokens stored under \`secure\` are server-only by design.
export function getAccessToken(tokenKey: string): string | undefined {
  const { session } = useUserSession()
  const value = (session.value as Record<string, unknown> | null | undefined)?.[tokenKey]
  return typeof value === 'string' ? value : undefined
}
`
        : `export function getAccessToken(_tokenKey: string): string | undefined {
  return undefined
}
`,
    })

    addTemplate({
      filename: 'postgrest-token-server.ts',
      write: true,
      getContents: () => hasAuthUtils
        ? `import type { H3Event } from 'h3'
// \`getUserSession\` only exists in Nitro's #imports. Nuxt also type-checks Nitro utils in the app
// context, where it's missing, so the check is suppressed here. Server type-checks still cover it.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getUserSession } from '#imports'

export async function getAccessToken(event: H3Event, tokenKey: string): Promise<string | undefined> {
  const session = await getUserSession(event) as Record<string, unknown> & { secure?: Record<string, unknown> }
  // Prefer the server-only \`secure\` field, fall back to the public session field
  const value = session?.secure?.[tokenKey] ?? session?.[tokenKey]
  return typeof value === 'string' ? value : undefined
}
`
        : `import type { H3Event } from 'h3'

export async function getAccessToken(_event: H3Event, _tokenKey: string): Promise<string | undefined> {
  return undefined
}
`,
    })

    // Nitro's `impound` plugin blocks the `#build/*` alias from server code (it's reserved for
    // the Vue app build), so the server template needs its own alias pointing at the same file.
    nuxt.options.alias['#postgrest-token/app'] = join(nuxt.options.buildDir, 'postgrest-token-app')
    nuxt.options.alias['#postgrest-token/server'] = join(nuxt.options.buildDir, 'postgrest-token-server')

    // --- Composables ---------------------------------------------------------
    const shared = resolver.resolve('./runtime/shared/utils/createPostgrestClient')

    addImports([
      { name: 'usePostgrest', from: resolver.resolve('./runtime/app/composables/usePostgrest') },
      { name: 'createPostgrestClient', from: shared },
    ])

    addServerImports([
      { name: 'usePostgrestUser', from: resolver.resolve('./runtime/server/utils/usePostgrestUser') },
      { name: 'usePostgrestAdmin', from: resolver.resolve('./runtime/server/utils/usePostgrestAdmin') },
      { name: 'createPostgrestClient', from: shared },
    ])
  },
})

function generateTypes(typesPath: string) {
  const dbUri = process.env.NUXT_POSTGREST_DB_URI
  if (!dbUri) {
    logger.warn('Skipping type generation: `NUXT_POSTGREST_DB_URI` is not set.')
    return
  }

  logger.start('Generating database types with the Supabase CLI...')
  try {
    // execFile (not a shell string) so the connection URI can't inject commands
    const output = execFileSync(
      'npx',
      ['--yes', 'supabase', 'gen', 'types', 'typescript', '--db-url', dbUri, '--schema', 'public'],
      { encoding: 'utf-8', timeout: 120_000, stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' },
    )
    // Never overwrite a good file with a partial/failed run
    if (!output.includes('export type Database')) {
      throw new Error('Unexpected CLI output (no `Database` type found)')
    }
    mkdirSync(dirname(typesPath), { recursive: true })
    writeFileSync(typesPath, output, 'utf-8')
    logger.success(`Database types written to ${typesPath}`)
  }
  catch (error) {
    logger.warn('Type generation failed. Is Docker running and `NUXT_POSTGREST_DB_URI` valid? Keeping the existing types file.')
    logger.debug(error)
  }
}
