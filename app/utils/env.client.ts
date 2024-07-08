import { z } from 'zod'

const schema = z.object({
	MODE: z.enum(['production', 'development', 'preview', 'test'] as const),
	SESSION_SECRET: z.string(),
	HONEYPOT_SECRET: z.string(),
	SENTRY_DSN: z.string(),
	RESEND_API_KEY: z.string(),
})

declare global {
	namespace NodeJS {
		interface ProcessEnv extends z.infer<typeof schema> {}
	}
}

export function init() {
	const parsed = schema.safeParse(process.env)

	if (parsed.success === false) {
		console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)

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
export function getClientEnv() {
	return {
		MODE: process.env.MODE,
		SENTRY_DSN: process.env.SENTRY_DSN,
		HONEYPOT_SECRET: process.env.HONEYPOT_SECRET,
	}
}
