import {
	vitePlugin as remix,
	cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from '@remix-run/dev'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import remixConfig from './remix.config'

export default defineConfig({
	plugins: [
		remixCloudflareDevProxy({ persist: { path: './tmp/data' } }),
		remix(remixConfig),
		tsconfigPaths(),
	],
	ssr: { noExternal: ['react-h5-audio-player'] },
	server: {
		port: 8080,
		fs: {
			// Restrict files that could be served by Vite's dev server.  Accessing
			// files outside this directory list that aren't imported from an allowed
			// file will result in a 403.  Both directories and files can be provided.
			// If you're comfortable with Vite's dev server making any file within the
			// project root available, you can remove this option.  See more:
			// https://vitejs.dev/config/server-options.html#server-fs-allow
			allow: ['app', 'node_modules'],
		},
	},
})
