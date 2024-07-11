import * as SentryBrowser from '@sentry/browser'
import * as Sentry from '@sentry/remix'
import { getEnv } from './env.server'

export function init({ env: { SENTRY_DSN, MODE } }: { env: ReturnType<typeof getEnv> }) {
	console.log('Initializing Sentry')
	console.log('Sentry DSN:', SENTRY_DSN)
	console.log('Loading Sentry integrations')
	// const debugIntegration = Sentry.debugIntegration()
	const browserProfilingIntegration = SentryBrowser.browserProfilingIntegration()
	console.log('✅ Loaded Sentry integrations')

	Sentry.init({
		dsn: SENTRY_DSN,
		environment: MODE,
		autoInstrumentRemix: true,
		beforeSend(event) {
			if (event.request?.url) {
				const url = new URL(event.request.url)
				if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
					// This error is from a browser extension, ignore it
					return null
				}
			}
			// Check if it is an exception, and if so, show the report dialog
			if (event.exception && event.event_id) {
				SentryBrowser.showReportDialog({ eventId: event.event_id })
			}
			return event
		},
		integrations: [browserProfilingIntegration], // debugIntegration

		// Set tracesSampleRate to 1.0 to capture 100%
		// of transactions for performance monitoring.
		// We recommend adjusting this value in production
		tracesSampleRate: 1.0, //MODE === 'production' ? 1 : 0,

		// Capture Replay for 10% of all sessions,
		// plus for 100% of sessions with an error
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
	})

	console.log('Sentry initialized')

	// setTimeout(() => {
	// 	throw new Error(`This is a ${MODE} client test error`)
	// }, 3000)
}
