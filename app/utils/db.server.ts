import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import chalk from 'chalk'
import ws from 'ws'

function shouldUseDirectDatasource(connectionString: string) {
	return /@(?:localhost|127\.0\.0\.1|postgres):\d+\//.test(connectionString)
}

export const prisma = (connectionString: string) => {
	// NOTE: if you change anything in this function you'll need to restart
	// the dev server to see your changes.

	// Feel free to change this log threshold to something that makes sense for you
	const logThreshold = 500 // ms

	const log = [
		{ level: 'query', emit: 'event' as const },
		{ level: 'error', emit: 'stdout' as const },
		{ level: 'warn', emit: 'stdout' as const },
	]

	const client = shouldUseDirectDatasource(connectionString)
		? new PrismaClient({
				datasources: { db: { url: connectionString } },
				log,
			})
		: (() => {
				neonConfig.webSocketConstructor = ws
				const pool = new Pool({ connectionString })
				const adapter = new PrismaNeon(pool)
				return new PrismaClient({ adapter, log })
			})()
	client.$on('query', async e => {
		if (e.duration < logThreshold) return
		const color =
			e.duration < logThreshold * 1.1
				? 'green'
				: e.duration < logThreshold * 1.2
					? 'blue'
					: e.duration < logThreshold * 1.3
						? 'yellow'
						: e.duration < logThreshold * 1.4
							? 'redBright'
							: 'red'
		const dur = chalk[color](`${e.duration}ms`)
		console.info(`prisma:query - ${dur} - ${e.query}`)
	})
	client.$connect()
	return client
}
export const db = prisma // alias for prisma
