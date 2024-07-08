import { RemixBrowser, useLocation, useMatches } from '@remix-run/react'
import * as Sentry from '@sentry/remix'
import { Buffer } from 'buffer-polyfill'
import { startTransition, useEffect } from 'react'
import { hydrateRoot } from 'react-dom/client'

if (ENV.MODE === 'production' && ENV.SENTRY_DSN) {
	import('./utils/monitoring.client.tsx').then(({ init }) => init({ env: ENV }))
}

Sentry.init({
	dsn: ENV.SENTRY_DSN,
	environment: ENV.MODE,
	beforeSend(event) {
		if (event.request?.url) {
			const url = new URL(event.request.url)
			if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
				// This error is from a browser extension, ignore it
				return null
			}
		}
		return event
	},
	integrations: [
		Sentry.browserTracingIntegration({
			useEffect,
			useLocation,
			useMatches,
		}),
		// Replay is only available in the client
		Sentry.replayIntegration(),
		Sentry.browserProfilingIntegration(),
	],

	// Set tracesSampleRate to 1.0 to capture 100%
	// of transactions for performance monitoring.
	// We recommend adjusting this value in production
	tracesSampleRate: 1.0,

	// Capture Replay for 10% of all sessions,
	// plus for 100% of sessions with an error
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
})

Sentry.init({
	dsn: 'https://024239230859a77960483b8dbc41ee81@o4506748231614464.ingest.us.sentry.io/4506748353314816',
	tracesSampleRate: 1,
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1,

	integrations: [
		Sentry.browserTracingIntegration({
			useEffect,
			useLocation,
			useMatches,
		}),
		Sentry.replayIntegration(),
	],
})

globalThis.Buffer = Buffer as unknown as BufferConstructor

startTransition(() => {
	hydrateRoot(
		document,
		// <StrictMode>
		<RemixBrowser />,
		// </StrictMode>,
	)
})
