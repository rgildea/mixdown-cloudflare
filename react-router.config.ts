import type { Config } from '@react-router/dev/config'

export default {
	// React Router v7 config for Cloudflare Workers
	// Keep the build output under `build` so SSR entrypoints that import `build/server`
	// continue to resolve correctly on Cloudflare Pages.
	buildDirectory: 'build',
} satisfies Config
