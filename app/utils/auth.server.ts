import { Connection, Password, Prisma, PrismaClient, User } from '@prisma/client/edge'
import { redirect } from '@remix-run/cloudflare'
import bcrypt from 'bcryptjs'
import { safeRedirect } from 'remix-utils/safe-redirect'
import { combineHeaders } from './misc'
import {
	createAuthSessionStorage,
	createConnectionSessionStorage,
	createToastSessionStorage,
	createVerificationSessionStorage,
} from './session.server'

export type StorageContext = {
	db: PrismaClient
	authSessionStorage: ReturnType<typeof createAuthSessionStorage>
	verificationSessionStorage: ReturnType<typeof createVerificationSessionStorage>
	toastSessionStorage: ReturnType<typeof createToastSessionStorage>
	connectionSessionStorage: ReturnType<typeof createConnectionSessionStorage>
}

export const sessionKey = 'sessionId'
export const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30
export const getSessionExpirationDate = () => new Date(Date.now() + SESSION_EXPIRATION_TIME)

export async function getUserId({ db, authSessionStorage }: StorageContext, request: Request) {
	const authSession = await authSessionStorage.getSession(request.headers.get('cookie'))
	const sessionId = authSession.get(sessionKey)
	if (!sessionId) return null
	const session = await db.session.findUnique({
		select: { user: { select: { id: true } } },
		where: { id: sessionId, expirationDate: { gt: new Date() } },
	})
	if (!session?.user) {
		throw redirect('/', {
			headers: {
				'set-cookie': await authSessionStorage.destroySession(authSession),
			},
		})
	}
	return session.user.id
}

const trackVersionWithAudioFile = Prisma.validator<Prisma.TrackVersionDefaultArgs>()({
	select: {
		id: true,
		version: true,
		title: true,
		audioFile: true,
	},
})

const tracksWithVersions = Prisma.validator<Prisma.TrackDefaultArgs>()({
	select: {
		id: true,
		title: true,
		versions: {
			select: trackVersionWithAudioFile.select,
			orderBy: { version: 'desc' },
		},
	},
})

const userWithTracks = Prisma.validator<Prisma.UserDefaultArgs>()({
	select: { id: true, email: true, name: true, tracks: tracksWithVersions },
})

export type UserWithTracks = Prisma.UserGetPayload<typeof userWithTracks>

export async function getUserWithTracks(storageContext: StorageContext, request: Request) {
	const userId = await getUserId(storageContext, request)
	const { db } = storageContext
	if (!userId) return null

	const user = await db.user.findUnique({
		select: {
			id: true,
			email: true,
			name: true,
			tracks: {
				select: tracksWithVersions.select,
				orderBy: { created_at: 'desc' },
			},
		},
		where: { id: userId },
	})
	return user
}

export async function requireUserId(
	storageContext: StorageContext,
	request: Request,
	{ redirectTo, redirectToLogin = true }: { redirectTo?: string | null; redirectToLogin?: boolean } = {},
) {
	const userId = await getUserId(storageContext, request)
	if (!userId) {
		const requestUrl = new URL(request.url)
		redirectTo = redirectTo === null ? null : redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`
		if (redirectToLogin) {
			const loginParams = redirectTo ? new URLSearchParams({ redirectTo }) : null
			const loginRedirect = ['/login', loginParams?.toString()].filter(Boolean).join('?')
			throw redirect(loginRedirect)
		} else {
			throw redirect(redirectTo || '/')
		}
	}
	return userId
}

export async function requireAnonymous(storageContext: StorageContext, request: Request) {
	const userId = await getUserId(storageContext, request)
	if (userId) {
		throw redirect('/')
	}
}

export async function login({ db, email, password }: { db: PrismaClient; email: User['email']; password: string }) {
	const user = await verifyUserPassword(db, { email }, password)
	if (!user) {
		return null
	}
	const session = await db.session.create({
		select: { id: true, expirationDate: true, userId: true },
		data: {
			expirationDate: getSessionExpirationDate(),
			userId: user.id,
		},
	})
	return session
}

export async function resetUserPassword({
	db,
	email,
	password,
}: {
	db: PrismaClient
	email: User['email']
	password: string
}) {
	const hashedPassword = await getPasswordHash(password)
	return db.user.update({
		where: { email },
		data: {
			password: {
				update: {
					hash: hashedPassword,
				},
			},
		},
	})
}

export async function signup({
	db,
	email,
	name,
	password,
}: {
	db: PrismaClient
	email: User['email']
	name: User['name']
	password: string
}) {
	const hashedPassword = await getPasswordHash(password)

	const session = await db.session.create({
		data: {
			expirationDate: getSessionExpirationDate(),
			user: {
				create: {
					email: email.toLowerCase(),
					name,
					roles: { connect: { name: 'user' } },
					password: {
						create: {
							hash: hashedPassword,
						},
					},
				},
			},
		},
		select: { id: true, expirationDate: true },
	})

	return session
}

export async function signupWithConnection({
	db,
	email,
	name,
	providerId,
	providerName,
}: {
	db: PrismaClient
	email: User['email']
	name: User['name']
	providerId: Connection['providerId']
	providerName: Connection['providerName']
}) {
	const session = await db.session.create({
		data: {
			expirationDate: getSessionExpirationDate(),
			user: {
				create: {
					email: email.toLowerCase(),
					name,
					roles: { connect: { name: 'user' } },
					connections: { create: { providerId, providerName } },
				},
			},
		},
		select: { id: true, expirationDate: true },
	})

	return session
}

export async function logout(
	{
		db,
		authSessionStorage,
		request,
		redirectTo = '/',
	}: {
		db: PrismaClient
		authSessionStorage: ReturnType<typeof createAuthSessionStorage>
		request: Request
		redirectTo?: string
	},
	responseInit?: ResponseInit,
) {
	const authSession = await authSessionStorage.getSession(request.headers.get('cookie'))
	const sessionId = authSession.get(sessionKey)
	// if this fails, we still need to delete the session from the user's browser
	// and it doesn't do any harm staying in the db anyway.
	if (sessionId) {
		// the .catch is important because that's what triggers the query.
		// learn more about PrismaPromise: https://www.prisma.io/docs/orm/reference/prisma-client-reference#prismapromise-behavior
		void db.session.deleteMany({ where: { id: sessionId } }).catch(() => {})
	}
	throw redirect(safeRedirect(redirectTo), {
		...responseInit,
		headers: combineHeaders(
			{ 'set-cookie': await authSessionStorage.destroySession(authSession) },
			responseInit?.headers,
		),
	})
}

export async function getPasswordHash(password: string) {
	const hash = await bcrypt.hash(password, 10)
	return hash
}

export async function verifyUserPassword(
	db: PrismaClient,
	where: Pick<User, 'email'> | Pick<User, 'id'>,
	password: Password['hash'],
) {
	const userWithPassword = await db.user.findUnique({
		where,
		select: { id: true, password: { select: { hash: true } } },
	})

	if (!userWithPassword || !userWithPassword.password) {
		return null
	}

	const isValid = await bcrypt.compare(password, userWithPassword.password.hash)

	if (!isValid) {
		return null
	}

	return { id: userWithPassword.id }
}
