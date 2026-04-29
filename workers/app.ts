import { createRequestHandler } from 'react-router'
import { db } from '../app/utils/db.server'
import { createStorageContext } from '../app/utils/storage-context.server'

// Extend the global Env interface from wrangler.toml bindings
interface WorkerEnv {
	COOKIE_SECRET?: string
	DATABASE_URL?: string
	HONEYPOT_SECRET: string
	// Cloudflare text bindings are always strings at runtime
	MOCKS: string
	RESEND_API_KEY?: string
	SESSIONS: KVNamespace
	STORAGE_BUCKET: R2Bucket
	SENTRY_AUTH_TOKEN: string
	SENTRY_DSN: string
	SENTRY_ORG: string
	SENTRY_PROJECT: string
	MODE: string
}

// Normalized env passed to the app: MOCKS is a boolean after runtime conversion
type NormalizedWorkerEnv = Omit<WorkerEnv, 'MOCKS'> & { MOCKS: boolean }

declare module 'react-router' {
	export interface AppLoadContext {
		cloudflare: {
			env: NormalizedWorkerEnv
			ctx: ExecutionContext
		}
		storageContext: import('../app/utils/auth.server').StorageContext
	}
}

const requestHandler = createRequestHandler(
	// @ts-expect-error - virtual module types don't match ServerBuild exactly at compile time
	() => import('virtual:react-router/server-build'),
	import.meta.env.MODE,
)

export default {
	async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
		const { COOKIE_SECRET, MODE, DATABASE_URL, SESSIONS, MOCKS } = env
		if (!SESSIONS) throw new Error('SESSIONS is not defined in the environment variables.')
		if (!COOKIE_SECRET) throw new Error('COOKIE_SECRET is not defined in the environment variables.')
		if (!MODE) throw new Error('MODE is not defined in the environment variables.')
		if (!DATABASE_URL) throw new Error('DATABASE_URL is not defined in the environment variables.')

		// Normalize MOCKS from a Cloudflare string binding to boolean so that
		// "false" (a truthy string) does not accidentally enable mocks mode.
		const normalizedEnv: NormalizedWorkerEnv = { ...env, MOCKS: MOCKS === 'true' || MOCKS === '1' }

		const database = db(DATABASE_URL)
		const storageContext = createStorageContext(COOKIE_SECRET, MODE, SESSIONS, database)

		return requestHandler(request, {
			cloudflare: { env: normalizedEnv, ctx },
			storageContext,
		})
	},
} satisfies ExportedHandler<WorkerEnv>
