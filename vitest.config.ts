/// <reference types="vitest" />

import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import path from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vite'

// Load environment variables from .dev.vars
dotenv.config({ path: '.dev.vars' })

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	css: { postcss: { plugins: [] } },
	test: {
		include: ['./app/**/*.test.{ts,tsx}'],
		setupFiles: ['./tests/setup/setup-test-env.ts'],
		globalSetup: ['./tests/setup/global-setup.ts'],
		fileParallelism: false,
		maxWorkers: 1,
		restoreMocks: true,
		coverage: {
			include: ['app/**/*.{ts,tsx}'],
			all: true,
		},
		poolOptions: {
			workers: {
				wrangler: { configPath: './wrangler.toml' },
			},
		},
	},
	resolve: {
		alias: {
			'#app': path.resolve(__dirname, 'app'),
		},
	},
} as any)
