import { createRequestHandler } from 'react-router'
import { db } from '../app/utils/db.server'
import { createStorageContext } from '../app/utils/storage-context.server'

// Extend the global Env interface from wrangler.toml bindings
interface WorkerEnv {
	COOKIE_SECRET?: string
	DATABASE_URL?: string
	HONEYPOT_SECRET: string
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

declare module 'react-router' {
	export interface AppLoadContext {
		cloudflare: {
			env: WorkerEnv
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
		const { COOKIE_SECRET, MODE, DATABASE_URL, SESSIONS } = env
		if (!SESSIONS) throw new Error('SESSIONS is not defined in the environment variables.')
		if (!COOKIE_SECRET) throw new Error('COOKIE_SECRET is not defined in the environment variables.')
		if (!MODE) throw new Error('MODE is not defined in the environment variables.')

		const database = db(DATABASE_URL || '')
		const storageContext = createStorageContext(COOKIE_SECRET, MODE, SESSIONS, database)

		return requestHandler(request, {
			cloudflare: { env, ctx },
			storageContext,
		})
	},
} satisfies ExportedHandler<WorkerEnv>
