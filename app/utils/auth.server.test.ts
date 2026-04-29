import { PrismaClient } from '@prisma/client'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'
import {
	getPasswordHash,
	login,
	resetUserPassword,
	signup,
	signupWithConnection,
	verifyUserPassword,
} from './auth.server'

let db: PrismaClient

beforeAll(() => {
	db = new PrismaClient()
})

beforeAll(async () => {
	await db.role.upsert({
		where: { name: 'user' },
		update: {},
		create: { name: 'user' },
	})
})

afterAll(async () => {
	await db.$disconnect()
})

afterEach(async () => {
	// Clean up test data
	await db.session.deleteMany({})
	await db.user.deleteMany({})
})

describe('auth.server', () => {
	test('getPasswordHash should hash a password', async () => {
		const password = 'test-password-123'
		const hash = await getPasswordHash(password)
		expect(hash).toBeDefined()
		expect(hash).not.toBe(password)
		expect(hash.length).toBeGreaterThan(0)
	})

	test('verifyUserPassword should return user id for valid password', async () => {
		const email = 'verify@example.com'
		const password = 'correct-password'
		const hashedPassword = await getPasswordHash(password)

		// Create test user
		const user = await db.user.create({
			data: {
				email,
				name: 'Test User',
				username: 'verifyuser',
				password: { create: { hash: hashedPassword } },
			},
		})

		// Verify correct password
		const result = await verifyUserPassword(db, { email }, password)
		expect(result).toBeDefined()
		expect(result?.id).toBe(user.id)
	})

	test('verifyUserPassword should return null for invalid password', async () => {
		const email = 'wrongpass@example.com'
		const password = 'correct-password'
		const hashedPassword = await getPasswordHash(password)

		await db.user.create({
			data: {
				email,
				name: 'Test User',
				username: 'wrongpassuser',
				password: { create: { hash: hashedPassword } },
			},
		})

		const result = await verifyUserPassword(db, { email }, 'wrong-password')
		expect(result).toBeNull()
	})

	test('login should create and return session for valid credentials', async () => {
		const email = 'login@example.com'
		const password = 'login-password'
		const hashedPassword = await getPasswordHash(password)

		await db.user.create({
			data: {
				email,
				name: 'Login User',
				username: 'loginuser',
				password: { create: { hash: hashedPassword } },
			},
		})

		const session = await login({ db, email, password })
		expect(session).toBeDefined()
		expect(session?.id).toBeDefined()
		expect(session?.expirationDate).toBeDefined()
		expect(session?.userId).toBeDefined()
	})

	test('login should return null for invalid credentials', async () => {
		const session = await login({ db, email: 'nonexistent@example.com', password: 'password' })
		expect(session).toBeNull()
	})

	test('signup should create user and return session', async () => {
		const session = await signup({
			db,
			email: 'signup@example.com',
			name: 'Signup User',
			password: 'signup-password',
		})

		expect(session).toBeDefined()
		expect(session?.id).toBeDefined()
		expect(session?.expirationDate).toBeDefined()

		// Verify user was created
		const user = await db.user.findUnique({ where: { email: 'signup@example.com' } })
		expect(user).toBeDefined()
		expect(user?.name).toBe('Signup User')
	})

	test('signupWithConnection should create user with connection and return session', async () => {
		const session = await signupWithConnection({
			db,
			email: 'connection@example.com',
			name: 'Connection User',
			providerId: 'provider-123',
			providerName: 'GitHub',
		})

		expect(session).toBeDefined()
		expect(session?.id).toBeDefined()

		// Verify connection was created
		const user = await db.user.findUnique({
			where: { email: 'connection@example.com' },
			include: { connections: true },
		})
		expect(user?.connections.length).toBe(1)
		expect(user?.connections[0]?.providerId).toBe('provider-123')
	})

	test('resetUserPassword should update password', async () => {
		const email = 'reset@example.com'
		const oldPassword = await getPasswordHash('old-password')
		const newPassword = 'new-password'

		await db.user.create({
			data: {
				email,
				name: 'Reset User',
				username: 'resetuser',
				password: { create: { hash: oldPassword } },
			},
		})

		const result = await resetUserPassword({ db, email, password: newPassword })
		expect(result).toBeDefined()

		// Verify old password no longer works
		const oldVerify = await verifyUserPassword(db, { email }, 'old-password')
		expect(oldVerify).toBeNull()

		// Verify new password works
		const newVerify = await verifyUserPassword(db, { email }, newPassword)
		expect(newVerify).toBeDefined()
	})
})
