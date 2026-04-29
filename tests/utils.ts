import { createAuthSessionStorage } from '#app/utils/session.server.ts'
import { sessionKey } from '#app/utils/auth.server.ts'
import * as setCookieParser from 'set-cookie-parser'

export const BASE_URL = 'https://www.epicstack.dev'

export function convertSetCookieToCookie(setCookie: string) {
	const parsedCookie = setCookieParser.parseString(setCookie)
	return new URLSearchParams({
		[parsedCookie.name]: parsedCookie.value,
	}).toString()
}

export async function getSessionSetCookieHeader(
	session: { id: string },
	existingCookie?: string,
	authSessionStorage = createAuthSessionStorage(
		process.env.COOKIE_SECRET || 'test-secret',
		process.env.MODE || 'test',
		// For testing, SESSIONS should be available from the worker context
		(globalThis as any).SESSIONS as KVNamespace,
	),
) {
	const authSession = await authSessionStorage.getSession(existingCookie)
	authSession.set(sessionKey, session.id)
	const setCookieHeader = await authSessionStorage.commitSession(authSession)
	return setCookieHeader
}

export async function getSessionCookieHeader(session: { id: string }, existingCookie?: string) {
	const setCookieHeader = await getSessionSetCookieHeader(session, existingCookie)
	return convertSetCookieToCookie(setCookieHeader)
}
