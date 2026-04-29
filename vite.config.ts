import { cloudflare } from '@cloudflare/vite-plugin'
import { reactRouter } from '@react-router/dev/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { glob } from 'glob'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
	plugins: [
		cloudflare({ viteEnvironment: { name: 'ssr' } }),
		reactRouter(),
		tsconfigPaths(),
		sentryVitePlugin({
			telemetry: false,
			authToken: process.env.SENTRY_AUTH_TOKEN,
			org: process.env.SENTRY_ORG,
			project: process.env.SENTRY_PROJECT,
			release: {
				name: process.env.COMMIT_SHA,
				setCommits: {
					auto: true,
				},
			},
			sourcemaps: {
				filesToDeleteAfterUpload: await glob(['./build/**/*.map', '.server-build/**/*.map']),
			},
		}),
	],

	ssr: { noExternal: 'react-h5-audio-player' },

	server: {
		port: 8080,
		fs: {
			allow: ['app', 'node_modules'],
		},
	},

	build: {
		sourcemap: true,
	},
})
