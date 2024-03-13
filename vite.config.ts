import {
	vitePlugin as remix,
	cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from '@remix-run/dev'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import remixConfig from './remix.config'
import { getLoadContext } from './load-context'

export default defineConfig({
	plugins: [
		remixCloudflareDevProxy({
			getLoadContext,
			persist: { path: './tmp/data' },
		}),
		remix(remixConfig),
		tsconfigPaths(),
	],
	ssr: { noExternal: ['react-h5-audio-player'] },
	server: {
		port: 8080,
		fs: {
			allow: ['app', 'node_modules'],
		},
	},
})
