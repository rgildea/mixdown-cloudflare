import { useLocation, useMatches } from '@remix-run/react'
import * as SentryReplay from '@sentry-internal/replay'
import * as SentryBrowser from '@sentry/browser'
import * as Sentry from '@sentry/remix'
import { useEffect } from 'react'
import { getEnv } from './env.server'

export function init({ env: { SENTRY_DSN, MODE } }: { env: ReturnType<typeof getEnv> }) {
	Sentry.init({
		dsn: SENTRY_DSN,
		environment: MODE,
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
			SentryReplay.replayIntegration(),
			SentryBrowser.browserProfilingIntegration(),
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

	console.log('Sentry initialized')
}
