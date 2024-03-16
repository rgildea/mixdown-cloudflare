import { CookieOptions, SessionStorage, createWorkersKVSessionStorage, redirect } from '@remix-run/cloudflare'
import { safeRedirect } from 'remix-utils/safe-redirect'
import { StorageContext, sessionKey } from './auth.server'
import { combineResponseInits } from './misc'
import { getRedirectToUrl, twoFAVerificationType } from './verification.server'

export const unverifiedSessionIdKey = 'unverified-session-id'
export const rememberKey = 'remember'

/**
 * Build a session storage object that uses Cloudflare Workers KV to store session data
 */
export function createSessionStorage(
	name: string,
	secret: string,
	environmentName: string,
	kvNamespace: KVNamespace<string>,
	cookieOptions?: CookieOptions,
) {
	return createWorkersKVSessionStorage({
		cookie: {
			name,
			sameSite: 'lax',
			path: '/',
			httpOnly: true,
			secrets: [secret],
			secure: environmentName === 'production',
			...cookieOptions,
		},
		kv: kvNamespace,
	})
}

/**
 * A workaround to preserve the original session expiration time when committing the session
 */
function preserveOriginalSessionExpiration(sessionStorage: SessionStorage) {
	const originalCommitSession = sessionStorage.commitSession

	Object.defineProperty(sessionStorage, 'commitSession', {
		value: async function commitSession(...args: Parameters<typeof originalCommitSession>) {
			const [session, options] = args
			if (options?.expires) {
				session.set('expires', options.expires)
			}
			if (options?.maxAge) {
				session.set('expires', new Date(Date.now() + options.maxAge * 1000))
			}
			const expires = session.has('expires') ? new Date(session.get('expires')) : undefined
			const setCookieHeader = await originalCommitSession(session, {
				...options,
				expires,
			})
			return setCookieHeader
		},
	})
}

/**
 * Build a session storage object that uses Cloudflare Workers KV to store authentication session data
 */
export function createAuthSessionStorage(secret: string, environmentName: string, kvNamespace: KVNamespace) {
	const authSessionStorage = createSessionStorage('en_session', secret, environmentName, kvNamespace)

	// we have to do this because every time you commit the session you overwrite it
	// so we store the expiration time in the cookie and reset it every time we commit
	preserveOriginalSessionExpiration(authSessionStorage)

	return authSessionStorage
}

/**
 * Build a session storage object that uses Cloudflare Workers KV to store verification session data
 */
export function createVerificationSessionStorage(secret: string, environmentName: string, kvNamespace: KVNamespace) {
	return createSessionStorage('en_verification', secret, environmentName, kvNamespace)
}

/**
 * Build a session storage object that uses Cloudflare Workers KV to store toast session data
 */
export function createToastSessionStorage(secret: string, environmentName: string, kvNamespace: KVNamespace) {
	return createSessionStorage('en_toast', secret, environmentName, kvNamespace)
}

/**
 * Build a connection storage object that uses Cloudflare Workers KV to store toast session data
 */
export function createConnectionSessionStorage(secret: string, environmentName: string, kvNamespace: KVNamespace) {
	return createSessionStorage('en_connection', secret, environmentName, kvNamespace, {
		maxAge: 60 * 10, // 10 minutes
	})
}

type HandleNewSessionFunctionArgs = {
	storageContext: StorageContext
	request: Request
	session: {
		userId: string
		id: string
		expirationDate: Date
	}
	redirectTo?: string
	remember: boolean
}
export async function handleNewSession(
	{ storageContext, request, session, redirectTo, remember }: HandleNewSessionFunctionArgs,
	responseInit?: ResponseInit,
) {
	const { db, authSessionStorage, verificationSessionStorage } = storageContext
	console.log('handling new session')
	const verification = await db.verification.findUnique({
		select: { id: true },
		where: {
			target_type: { target: session.userId, type: twoFAVerificationType },
		},
	})
	const userHasTwoFactor = Boolean(verification)

	if (userHasTwoFactor) {
		console.log(`user ${session.userId} has two factor enabled, redirecting to verification page`)
		const verifySession = await verificationSessionStorage.getSession()
		verifySession.set(unverifiedSessionIdKey, session.id)
		verifySession.set(rememberKey, remember)
		const redirectUrl = getRedirectToUrl({
			request,
			type: twoFAVerificationType,
			target: session.userId,
			redirectTo,
		})
		return redirect(
			`${redirectUrl.pathname}?${redirectUrl.searchParams}`,
			combineResponseInits(
				{
					headers: {
						'set-cookie': await verificationSessionStorage.commitSession(verifySession),
					},
				},
				responseInit,
			),
		)
	} else {
		console.log(`user ${session.userId} doesn't have two factor enabled, logging in`)
		const authSession = await authSessionStorage.getSession(request.headers.get('cookie'))
		authSession.set(sessionKey, session.id)

		return redirect(
			safeRedirect(redirectTo),
			combineResponseInits(
				{
					headers: {
						'set-cookie': await authSessionStorage.commitSession(authSession, {
							expires: remember ? session.expirationDate : undefined,
						}),
					},
				},
				responseInit,
			),
		)
	}
}
