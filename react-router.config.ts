import type { Config } from '@react-router/dev/config'

export default {
	// React Router v7 config for Cloudflare Workers
	// Keep the build output under `build` so Cloudflare assets/server outputs are stable.
	buildDirectory: 'build',
	ssr: true,
	future: {
		v8_viteEnvironmentApi: true,
	},
} satisfies Config
