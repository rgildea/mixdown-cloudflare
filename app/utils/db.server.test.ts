import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { prisma } from './db.server'

let client: ReturnType<typeof prisma>

beforeAll(() => {
	const databaseUrl = process.env.DATABASE_URL
	if (!databaseUrl) {
		throw new Error('DATABASE_URL environment variable is not set')
	}
	client = prisma(databaseUrl)
})

afterAll(async () => {
	await client.$disconnect()
})

describe('db.server', () => {
	test('prisma should return PrismaClient instance', () => {
		expect(client).toBeDefined()
		expect(client).toHaveProperty('$connect')
		expect(client).toHaveProperty('$disconnect')
	})

	test('prisma should be able to query the database', async () => {
		const userCount = await client.user.count()
		expect(typeof userCount).toBe('number')
		expect(userCount).toBeGreaterThanOrEqual(0)
	})
})
