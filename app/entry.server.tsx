import * as Sentry from '@sentry/remix'
/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import type { AppLoadContext, EntryContext } from '@remix-run/cloudflare'
import { RemixServer } from '@remix-run/react'
import { isbot } from 'isbot'
import { renderToReadableStream } from 'react-dom/server'
import * as Monitoring from './utils/monitoring.server.ts'

export const handleError = Sentry.sentryHandleError

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext,
	// This is ignored so we can keep it in the template for visibility.  Feel
	// free to delete this parameter in your app if you're not using it!
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	loadContext: AppLoadContext,
) {
	Monitoring.init({ context: loadContext })
	const body = await renderToReadableStream(<RemixServer context={remixContext} url={request.url} />, {
		signal: request.signal,
		onError(error: unknown) {
			// Log streaming rendering errors from inside the shell
			console.error(error)
			responseStatusCode = 500
		},
	})

	if (isbot(request.headers.get('user-agent') || '')) {
		await body.allReady
	}

	responseHeaders.set('Content-Type', 'text/html')
	return new Response(body, {
		headers: responseHeaders,
		status: responseStatusCode,
	})
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
	return {
		MODE: process.env.NODE_ENV,
		SENTRY_DSN: process.env.SENTRY_DSN,
		SENTRY_ORG: process.env.SENTRY_ORG,
		SENTRY_PROJECT: process.env.SENTRY_PROJECT,
		SENTRY_API_TOKEN: 'redacted',
		MOCKS: false,
		RESEND_API_KEY: 'redacted',
		HONEYPOT_SECRET: process.env.HONEYPOT_SECRET,
	}
}
type ENV = ReturnType<typeof getEnv>

declare global {
	var ENV: ENV
	interface Window {
		ENV: ENV
	}
}
