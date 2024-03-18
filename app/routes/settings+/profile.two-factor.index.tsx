import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { generateTOTP } from '#app/utils/totp.server.ts'
import { twoFAVerificationType, twoFAVerifyVerificationType } from '#app/utils/verification.server.ts'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'

export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

export async function loader({ context: { storageContext }, request }: LoaderFunctionArgs) {
	const userId = await requireUserId(storageContext, request)
	const verification = await storageContext.db.verification.findUnique({
		where: { target_type: { type: twoFAVerificationType, target: userId } },
		select: { id: true },
	})
	return json({ is2FAEnabled: Boolean(verification) })
}

export async function action({ context: { storageContext }, request }: ActionFunctionArgs) {
	const userId = await requireUserId(storageContext, request)

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { otp: _otp, ...config } = generateTOTP()
	const verificationData = {
		...config,
		type: twoFAVerifyVerificationType,
		target: userId,
	}
	await storageContext.db.verification.upsert({
		where: {
			target_type: { target: userId, type: twoFAVerifyVerificationType },
		},
		create: verificationData,
		update: verificationData,
	})
	return redirect('/settings/profile/two-factor/verify')
}

export default function TwoFactorRoute() {
	const data = useLoaderData<typeof loader>()
	const enable2FAFetcher = useFetcher<typeof action>()

	return (
		<div className="flex flex-col gap-4">
			{data.is2FAEnabled ? (
				<>
					<p className="text-lg">
						<Icon name="check">You have enabled two-factor authentication.</Icon>
					</p>
					<Link to="disable">
						<Icon name="lock-open-1">Disable 2FA</Icon>
					</Link>
				</>
			) : (
				<>
					<p>
						<Icon name="lock-open-1">You have not enabled two-factor authentication yet.</Icon>
					</p>
					<p className="text-sm">
						Two factor authentication adds an extra layer of security to your account. You will need to enter a code
						from an authenticator app like{' '}
						<a className="underline" href="https://1password.com/">
							1Password
						</a>{' '}
						to log in.
					</p>
					<enable2FAFetcher.Form method="POST">
						<StatusButton
							type="submit"
							name="intent"
							value="enable"
							status={enable2FAFetcher.state === 'loading' ? 'pending' : 'idle'}
							className="mx-auto"
						>
							Enable 2FA
						</StatusButton>
					</enable2FAFetcher.Form>
				</>
			)}
		</div>
	)
}
