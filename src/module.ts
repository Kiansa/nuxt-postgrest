import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
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

/**
 * Where the module reads the current user's PostgREST JWT from.
 * - `nuxt-auth-utils`: reads `session[tokenKey]` (client) or `session.secure[tokenKey] ?? session[tokenKey]` (server)
 * - `none`: no automatic token; pass `{ token }` explicitly or fall back to the anon key
 */
export type AuthProvider = 'nuxt-auth-utils' | 'none'

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
   * Default Postgres schema for all clients.
   * @default 'public'
   */
  schema?: string
  auth?: {
    /**
     * Auth integration used to read the user's JWT. Auto-detected when omitted.
     */
    provider?: AuthProvider
    /**
     * Session field holding the PostgREST JWT.
     * @default 'postgrest_token'
     */
    tokenKey?: string
  }
  types?: {
    /**
     * Path to the generated `Database` type file. Used to type every client.
     * @default '~~/shared/types/database.types.ts'
     */
    path?: string
    /**
     * Generate the file with the Supabase CLI on `nuxt dev` / `nuxt prepare`.
     * Requires `NUXT_POSTGREST_DB_URI` and a running Docker daemon. Never runs during `nuxt build`.
     * @default false
     */
    generate?: boolean
    /**
     * Schemas to include in generated types.
     * @default ['public']
     */
    schemas?: string[]
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-postgrest',
    configKey: 'postgrest',
    compatibility: {
      nuxt: '^3.21.0 || >=4.0.0',
    },
  },
  defaults: {
    url: '',
    key: '',
    schema: 'public',
    auth: {
      provider: undefined,
      tokenKey: 'postgrest_token',
    },
    types: {
      path: '~~/shared/types/database.types.ts',
      generate: false,
      schemas: ['public'],
    },
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // --- Auth provider -------------------------------------------------------
    let provider = options.auth?.provider
    if (!provider) {
      provider = hasNuxtModule('nuxt-auth-utils', nuxt) ? 'nuxt-auth-utils' : 'none'
      logger.debug(`Auth provider: ${provider} (auto-detected)`)
    }
    if (provider === 'nuxt-auth-utils' && !hasNuxtModule('nuxt-auth-utils', nuxt)) {
      logger.warn('`auth.provider` is `nuxt-auth-utils` but the module is not installed. Falling back to `none`.')
      provider = 'none'
    }
    // Only the matching adapter gets bundled, so apps without nuxt-auth-utils never reference its auto-imports
    nuxt.options.alias['#postgrest-auth/app'] = resolver.resolve(`./runtime/app/auth/${provider}`)
    nuxt.options.alias['#postgrest-auth/server'] = resolver.resolve(`./runtime/server/auth/${provider}`)

    // --- Runtime config ------------------------------------------------------
    nuxt.options.runtimeConfig.public.postgrest = defu(
      nuxt.options.runtimeConfig.public.postgrest as Record<string, unknown> | undefined,
      {
        url: options.url || '',
        key: options.key || '',
        schema: options.schema || 'public',
        authProvider: provider,
        tokenKey: options.auth?.tokenKey || 'postgrest_token',
      },
    )
    nuxt.options.runtimeConfig.postgrest = defu(
      nuxt.options.runtimeConfig.postgrest as Record<string, unknown> | undefined,
      { secretKey: '' },
    )

    // --- Database types ------------------------------------------------------
    const typesPath = await resolvePath(options.types?.path || '~~/shared/types/database.types.ts')
    const shouldGenerate = options.types?.generate
      && (nuxt.options.dev || nuxt.options._prepare)
      && !nuxt.options.test

    if (shouldGenerate) {
      // Runs before templates are rendered, so the type template below sees the fresh file
      nuxt.hook('modules:done', () => {
        generateTypes(typesPath, options.types?.schemas || ['public'])
      })
    }

    addTemplate({
      filename: 'types/postgrest-database.d.ts',
      write: true,
      getContents: () => existsSync(typesPath)
        ? `export type { Database } from '${typesPath.replace(/(\.d)?\.ts$/, '')}'\n`
        : `// No types found at ${typesPath}. See https://github.com/YOUR_GH_USER/nuxt-postgrest#types\nexport type Database = any\n`,
    })

    // --- Composables ---------------------------------------------------------
    const shared = resolver.resolve('./runtime/shared/createPostgrestClient')

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

function generateTypes(typesPath: string, schemas: string[]) {
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
      ['--yes', 'supabase', 'gen', 'types', 'typescript', '--db-url', dbUri, '--schema', schemas.join(',')],
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
