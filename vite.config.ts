import { vitePlugin as remix, cloudflareDevProxyVitePlugin as remixCloudflareDevProxy } from '@remix-run/dev'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { glob } from 'glob'
import { remixDevTools } from 'remix-development-tools'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { getLoadContext } from './load-context'
import remixConfig from './remix.config'

export default defineConfig({
	plugins: [
		remixCloudflareDevProxy({
			getLoadContext,
			persist: { path: './tmp/data' },
		}),
		remixDevTools(),
		remix(remixConfig),
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
