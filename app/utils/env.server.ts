import { getEnv } from '#app/entry.server'
import * as cfProcess from 'node:process'
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
	const parsed = schema.safeParse(cfProcess.env)

	if (parsed.success === false) {
		console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)

		throw new Error('Invalid environment variables')
	}
}

export function getServerEnv() {
	return process.env
}

type ENV = ReturnType<typeof getEnv>

declare global {
	var ENV: ENV
	interface Window {
		ENV: ENV
	}
}
