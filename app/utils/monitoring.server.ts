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

	try {
		// console.log('Loading Sentry integrations')
		// const debugIntegration = Sentry.debugIntegration()
		// const prismaIntegration = Sentry.prismaIntegration()
		// console.log('✅ Loaded Sentry integrations')
		Sentry.init({
			dsn: env.SENTRY_DSN,
			environment: env.MODE,
			tracesSampleRate: env.MODE === 'production' ? 1 : 0,
			// integrations: [
			// 	prismaIntegration,
			// 	// , debugIntegration
			// ],
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
	} catch (err) {
		console.error('❌ Failed to initialize Sentry:', err)
	}

	console.log('Sentry initialized')
}
