import { VitePluginConfig } from '@remix-run/dev'
import { flatRoutes } from 'remix-flat-routes'

/** @type {import('@remix-run/dev/dist/vite/plugin').VitePluginConfig} */
export default {
	ignoredRouteFiles: ['**/*'],
	serverModuleFormat: 'esm',
	routes: async defineRoutes => {
		return flatRoutes('routes', defineRoutes, {
			ignoredRouteFiles: [
				'.*',
				'**/*.css',
				'**/*.test.{js,jsx,ts,tsx}',
				'**/__*.*',
			],
		})
	},
} as VitePluginConfig
