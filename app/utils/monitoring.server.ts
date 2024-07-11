import { AppLoadContext } from '@remix-run/cloudflare'
import * as Sentry from '@sentry/remix'

export function init({
	context: {
		cloudflare: { env },
	},
}: {
	context: AppLoadContext
}) {
	console.log('Initializing Sentry')
	console.log('Sentry DSN:', env.SENTRY_DSN)
	Sentry.init({
		dsn: env.SENTRY_DSN,
		environment: env.MODE,
		tracesSampleRate: env.MODE === 'production' ? 1 : 0,
		integrations: [...Sentry.getRemixDefaultIntegrations({}), Sentry.prismaIntegration()],
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
