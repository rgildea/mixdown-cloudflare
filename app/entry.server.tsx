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
// import { init as initEnv } from './utils/env.server'
import * as Monitoring from './utils/monitoring.server.ts'

// initEnv()

export const handleError = Sentry.sentryHandleError

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext,
	loadContext: AppLoadContext,
) {
	Monitoring.init({ context: loadContext })
	// throw new Error(`This is a super new ${loadContext.cloudflare?.env?.MODE || 'unkown environment'} server test error`)

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
