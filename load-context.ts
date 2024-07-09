import { AppLoadContext } from '@remix-run/cloudflare'
import { type PlatformProxy } from 'wrangler'
import { StorageContext } from './app/utils/auth.server'
import { db } from './app/utils/db.server'
import {
	createAuthSessionStorage,
	createConnectionSessionStorage,
	createToastSessionStorage,
	createVerificationSessionStorage,
} from './app/utils/session.server'

// When using `wrangler.toml` to configure bindings,
// `wrangler types` will generate types for those bindings
// into the global `Env` interface.
// Need this empty interface so that typechecking passes
// even if no `wrangler.toml` exists.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Env {
	COOKIE_SECRET?: string
	DATABASE_URL?: string
	HONEYPOT_SECRET: string
	MOCKS: boolean
	RESEND_API_KEY?: string
	SESSIONS: KVNamespace
	STORAGE_BUCKET: R2Bucket
	SENTRY_AUTH_TOKEN: string
	SENTRY_DSN: string
	SENTRY_ORG: string
	SENTRY_PROJECT: string
	MODE: 'production' | 'development' | 'test' | 'preview'
}

type Cloudflare = Omit<PlatformProxy<Env>, 'dispose'>

declare module '@remix-run/cloudflare' {
	interface AppLoadContext {
		cloudflare: Cloudflare
		storageContext: StorageContext
	}
}

type GetLoadContext = (args: {
	request: Request
	context: { cloudflare: Cloudflare } // load context _before_ augmentation
}) => AppLoadContext

export const getLoadContext: GetLoadContext = ({ context }) => {
	const { COOKIE_SECRET, MODE, DATABASE_URL, SESSIONS } = context.cloudflare.env
	if (!SESSIONS) throw new Error('SESSIONS is not defined in the environment variables.')
	if (!COOKIE_SECRET) throw new Error('COOKIE_SECRET is not defined in the environment variables.')
	if (!MODE) throw new Error('MODE is not defined in the environment variables.')

	const database = db(DATABASE_URL || '')

	const authSessionStorage = createAuthSessionStorage(COOKIE_SECRET, MODE, SESSIONS)
	const verificationSessionStorage = createVerificationSessionStorage(COOKIE_SECRET, MODE, SESSIONS)
	const toastSessionStorage = createToastSessionStorage(COOKIE_SECRET, MODE, SESSIONS)
	const connectionSessionStorage = createConnectionSessionStorage(COOKIE_SECRET, MODE, SESSIONS)
	const storageContext: StorageContext = {
		db: database,
		authSessionStorage,
		verificationSessionStorage,
		toastSessionStorage,
		connectionSessionStorage,
	}

	return {
		cloudflare: context.cloudflare,
		storageContext,
	}
}
