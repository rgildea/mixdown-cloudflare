// import { ProfilingIntegration } from '@sentry/profiling-node'
import { AppLoadContext } from '@remix-run/cloudflare'
import * as Sentry from '@sentry/remix'
export function init({
	context: {
		cloudflare: { env },
	},
}: {
	context: AppLoadContext
}) {
	console.log('Initializing Sentry', env)
	Sentry.init({
		dsn: env.SENTRY_DSN,
		environment: env.MODE,
		tracesSampleRate: env.MODE === 'production' ? 1 : 0,
		denyUrls: [
			/\/resources\/healthcheck/,
			// TODO: be smarter about the public assets...
			/\/build\//,
			/\/favicons\//,
			/\/img\//,
			/\/fonts\//,
			/\/favicon.ico/,
			/\/site\.webmanifest/,
		],
	})

	console.log('Sentry initialized')
}