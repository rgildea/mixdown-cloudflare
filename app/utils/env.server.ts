import * as cfProcess from 'node:process'
import { z } from 'zod'

const schema = z.object({
	COOKIE_SECRET: z.string(),
	DATABASE_URL: z.string(),
	DIRECT_URL: z.string(),
	HONEYPOT_SECRET: z.string(),
	MOCKS: z.any(),
	MODE: z.enum(['production', 'development', 'preview', 'test'] as const),
	RESEND_API_KEY: z.string(),
	SENTRY_AUTH_TOKEN: z.string(),
	SENTRY_DSN: z.string(),
	SENTRY_ORG: z.string(),
	SENTRY_PROJECT: z.string(),
	SESSION_SECRET: z.string(),
	STORAGE_BUCKET: z.any(),
})

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace NodeJS {
		interface ProcessEnv extends z.infer<typeof schema> {}
	}
}

export function init() {
	console.log('🔧 Validating environment variables...')
	const parsed = schema.safeParse(cfProcess.env)

	if (parsed.success === false) {
		console.error('❌ Invalid environment variables:', parsed.error.errors)

		throw new Error('Invalid environment variables')
	}
}

/**
 * This is used in both `entry.server.ts` and `root.tsx` to ensure that
 * the environment variables are set and globally available before the app is
 * started.
 *
 * NOTE: Do *not* add any environment variables in here that you do not wish to
 * be included in the client.
 * @returns all public ENV variables
 */
export function getEnv() {
	return cfProcess.env as Pick<
		z.infer<typeof schema>,
		| 'COOKIE_SECRET'
		| 'HONEYPOT_SECRET'
		| 'MODE'
		| 'MOCKS'
		| 'SENTRY_AUTH_TOKEN'
		| 'SENTRY_DSN'
		| 'SENTRY_ORG'
		| 'SENTRY_PROJECT'
	>
}

export type EnvironmentConfig = ReturnType<typeof getEnv>

declare global {
	let ENV: EnvironmentConfig
	interface Window {
		ENV: EnvironmentConfig
	}
}
