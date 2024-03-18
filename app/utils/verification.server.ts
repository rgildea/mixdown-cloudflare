import {
	VerificationTypes,
	VerifyFunctionArgs,
	codeQueryParam,
	redirectToQueryParam,
	targetQueryParam,
	typeQueryParam,
} from '#app/routes/_auth+/verify'
import { generateTOTP, verifyTOTP } from '@epic-web/totp'
import { StorageContext, getUserId, requireUserId, sessionKey } from './auth.server'
import { getDomainUrl } from './misc'
import { rememberKey, unverifiedSessionIdKey } from './session.server'
import { redirectWithToast } from './toast.server'
import { onboardingEmailSessionKey } from '#app/routes/_auth+/onboarding'
import { invariant } from '@epic-web/invariant'
import { json, redirect } from '@remix-run/cloudflare'
import { sendEmail } from './email.server'
import { EmailChangeNoticeEmail } from '#app/routes/settings+/profile.change-email'
import React from 'react'
import { safeRedirect } from 'remix-utils/safe-redirect'

export const VerificationSessionKeys = {
	onboarding: 'onboardingEmail',
	'reset-password': 'resetPasswordEmail',
	'change-email': 'newEmailAddress',
	'2fa': '2fa-verify',
}

const verifiedTimeKey = 'verified-time'
export const twoFAVerificationType = '2fa' satisfies VerificationTypes
export const twoFAVerifyVerificationType = '2fa-verify'

// export function handleLoginTwoFactorVerification({ request, body, submission }: VerifyFunctionArgs) {}
// export function handleChangeEmailVerification({ request, body, submission }: VerifyFunctionArgs) {}

export async function handleResetPasswordVerification({ storageContext, submission }: VerifyFunctionArgs) {
	invariant(submission.status === 'success', 'Submission should be successful by now')
	const target = submission.value.target
	const user = await storageContext.db.user.findFirst({
		where: { OR: [{ email: target }] },
		select: { email: true },
	})
	// we don't want to say the user is not found if the email is not found
	// because that would allow an attacker to check if an email is registered
	if (!user) {
		return json(
			{
				result: submission.reply({ fieldErrors: { code: ['Invalid code'] } }),
			},
			{
				status: 400,
			},
		)
	}
}

export async function handleOnboardingVerification({ storageContext, submission }: VerifyFunctionArgs) {
	invariant(submission.status === 'success', 'Submission should be successful by now')
	const verifySession = await storageContext.verificationSessionStorage.getSession()
	verifySession.set(onboardingEmailSessionKey, submission.value.target)
	return redirect('/onboarding', {
		headers: {
			'set-cookie': await storageContext.verificationSessionStorage.commitSession(verifySession),
		},
	})
}

export async function handleChangeEmailVerification({
	RESEND_API_KEY,
	MOCKS,
	storageContext,
	request,
	submission,
}: VerifyFunctionArgs) {
	await requireRecentVerification(storageContext, request)
	invariant(submission.status === 'success', 'Submission should be successful by now')

	const verifySession = await storageContext.verificationSessionStorage.getSession(request.headers.get('cookie'))
	const newEmail = verifySession.get(VerificationSessionKeys['change-email'])
	if (!newEmail) {
		return json(
			{
				result: submission.reply({
					formErrors: ['You must submit the code on the same device that requested the email change.'],
				}),
			},
			{ status: 400 },
		)
	}
	const { db, verificationSessionStorage, toastSessionStorage } = storageContext
	const preUpdateUser = await db.user.findFirstOrThrow({
		select: { email: true },
		where: { id: submission.value.target },
	})
	const user = await db.user.update({
		where: { id: submission.value.target },
		select: { id: true, email: true, name: true },
		data: { email: newEmail },
	})

	await sendEmail(RESEND_API_KEY, MOCKS, {
		to: preUpdateUser.email,
		subject: 'Mixdown email changed',
		react: React.createElement(EmailChangeNoticeEmail, { userId: user.id }),
	})

	return redirectWithToast(
		toastSessionStorage,
		'/settings/profile',
		{
			title: 'Email Changed',
			type: 'success',
			description: `Your email has been changed to ${user.email}`,
		},
		{
			headers: {
				'set-cookie': await verificationSessionStorage.destroySession(verifySession),
			},
		},
	)
}

export async function handleLoginTwoFactorVerification({ storageContext, request, submission }: VerifyFunctionArgs) {
	invariant(submission.status === 'success', 'Submission should be successful by now')
	const authSession = await storageContext.authSessionStorage.getSession(request.headers.get('cookie'))
	const verifySession = await storageContext.verificationSessionStorage.getSession(request.headers.get('cookie'))

	const remember = verifySession.get(rememberKey)
	const { redirectTo } = submission.value
	const headers = new Headers()
	authSession.set(verifiedTimeKey, Date.now())

	const unverifiedSessionId = verifySession.get(unverifiedSessionIdKey)
	if (unverifiedSessionId) {
		const session = await storageContext.db.session.findUnique({
			select: { expirationDate: true },
			where: { id: unverifiedSessionId },
		})
		if (!session) {
			throw await redirectWithToast(storageContext.toastSessionStorage, '/login', {
				type: 'error',
				title: 'Invalid session',
				description: 'Could not find session to verify. Please try again.',
			})
		}
		authSession.set(sessionKey, unverifiedSessionId)

		headers.append(
			'set-cookie',
			await storageContext.authSessionStorage.commitSession(authSession, {
				expires: remember ? session.expirationDate : undefined,
			}),
		)
	} else {
		headers.append('set-cookie', await storageContext.authSessionStorage.commitSession(authSession))
	}

	headers.append('set-cookie', await storageContext.verificationSessionStorage.destroySession(verifySession))

	return redirect(safeRedirect(redirectTo), { headers })
}

export async function shouldRequestTwoFA(storageContext: StorageContext, request: Request) {
	const db = storageContext.db
	const authSession = await storageContext.authSessionStorage.getSession(request.headers.get('cookie'))
	const verifySession = await storageContext.verificationSessionStorage.getSession(request.headers.get('cookie'))
	if (verifySession.has(unverifiedSessionIdKey)) return true
	const userId = await getUserId(storageContext, request)
	if (!userId) return false
	// if it's over two hours since they last verified, we should request 2FA again
	const userHasTwoFA = await db.verification.findUnique({
		select: { id: true },
		where: { target_type: { target: userId, type: twoFAVerificationType } },
	})
	if (!userHasTwoFA) return false
	const verifiedTime = authSession.get(verifiedTimeKey) ?? new Date(0)
	const twoHours = 1000 * 60 * 2
	return Date.now() - verifiedTime > twoHours
}

export function getRedirectToUrl({
	request,
	type,
	target,
	redirectTo,
}: {
	request: Request
	type: VerificationTypes
	target: string
	redirectTo?: string
}) {
	const redirectToUrl = new URL(`${getDomainUrl(request)}/verify`)
	redirectToUrl.searchParams.set(typeQueryParam, type)
	redirectToUrl.searchParams.set(targetQueryParam, target)
	if (redirectTo) {
		redirectToUrl.searchParams.set(redirectToQueryParam, redirectTo)
	}
	return redirectToUrl
}

export async function requireRecentVerification(storageContext: StorageContext, request: Request) {
	const userId = await requireUserId(storageContext, request)
	const shouldReverify = await shouldRequestTwoFA(storageContext, request)
	if (shouldReverify) {
		const reqUrl = new URL(request.url)
		const redirectUrl = getRedirectToUrl({
			request,
			target: userId,
			type: twoFAVerificationType,
			redirectTo: reqUrl.pathname + reqUrl.search,
		})
		throw await redirectWithToast(storageContext.toastSessionStorage, redirectUrl.toString(), {
			title: 'Please Reverify',
			description: 'Please reverify your account before proceeding',
		})
	}
}

export async function prepareVerification({
	storageContext,
	period,
	request,
	type,
	target,
}: {
	storageContext: StorageContext
	period: number
	request: Request
	type: VerificationTypes
	target: string
}) {
	const verifyUrl = getRedirectToUrl({ request, type, target })
	const redirectTo = new URL(verifyUrl.toString())

	const { otp, ...verificationConfig } = generateTOTP({
		algorithm: 'SHA256',
		// Leaving off 0 and O on purpose to avoid confusing users.
		charSet: 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789',
		period,
	})
	const verificationData = {
		type,
		target,
		...verificationConfig,
		expiresAt: new Date(Date.now() + verificationConfig.period * 1000),
	}
	await storageContext.db.verification.upsert({
		where: { target_type: { target, type } },
		create: verificationData,
		update: verificationData,
	})

	// add the otp to the url we'll email the user.
	verifyUrl.searchParams.set(codeQueryParam, otp)

	return { otp, redirectTo, verifyUrl }
}

export async function isCodeValid({
	storageContext,
	code,
	type,
	target,
}: {
	storageContext: StorageContext
	code: string
	type: VerificationTypes | typeof twoFAVerifyVerificationType
	target: string
}) {
	const { db } = storageContext
	const verification = await db.verification.findUnique({
		where: {
			target_type: { target, type },
			OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
		},
		select: { algorithm: true, secret: true, period: true, charSet: true },
	})
	if (!verification) return false
	const result = verifyTOTP({
		otp: code,
		...verification,
	})
	if (!result) return false

	return true
}
