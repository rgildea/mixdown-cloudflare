import { createRelease } from '@sentry/remix/scripts/createRelease.js'
import 'dotenv/config'
import { glob } from 'glob'
import fs from 'node:fs'

const DEFAULT_URL_PREFIX = '#build/'
const DEFAULT_BUILD_PATH = 'public/build'
const processFiles = async () => {
	const files = await glob(['./public/**/*.map', './build/**/*.map'])
	for (const file of files) {
		// remove file
		await fs.promises.unlink(file)
	}
}
// exit with non-zero code if we have everything for Sentry
if (process.env.SENTRY_DSN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT && process.env.SENTRY_AUTH_TOKEN) {
	createRelease({}, DEFAULT_URL_PREFIX, DEFAULT_BUILD_PATH)
} else {
	console.log('Missing Sentry environment variables, skipping sourcemap upload.')
}

processFiles()
