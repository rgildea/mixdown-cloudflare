import type { Config } from '@react-router/dev/config'

export default {
	// React Router v7 config for Cloudflare Workers
	// buildDirectory must match @cloudflare/vite-plugin's default client output directory
	buildDirectory: 'dist',
} satisfies Config
