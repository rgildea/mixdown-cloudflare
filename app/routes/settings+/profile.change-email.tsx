import { ErrorList, Field } from '#app/components/forms.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { sendEmail } from '#app/utils/email.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { EmailSchema } from '#app/utils/user-validation.ts'
import { prepareVerification, requireRecentVerification } from '#app/utils/verification.server.ts'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { Html } from '@react-email/html'
import { Container } from '@react-email/container'
import { Text } from '@react-email/text'
import { Link } from '@react-email/link'
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { type BreadcrumbHandle } from './profile.tsx'

export const handle: BreadcrumbHandle & SEOHandle = {
	breadcrumb: <Icon name="envelope-closed">Change Email</Icon>,
	getSitemapEntries: () => null,
}

const newEmailAddressSessionKey = 'new-email-address'

const ChangeEmailSchema = z.object({
	email: EmailSchema,
})

export async function loader({ context: { storageContext }, request }: LoaderFunctionArgs) {
	await requireRecentVerification(storageContext, request)
	const userId = await requireUserId(storageContext, request)
	const user = await storageContext.db.user.findUnique({
		where: { id: userId },
		select: { email: true },
	})
	if (!user) {
		const params = new URLSearchParams({ redirectTo: request.url })
		throw redirect(`/login?${params}`)
	}
	return json({ user })
}

export async function action({
	context: {
		storageContext,
		cloudflare: {
			env: { RESEND_API_KEY, MOCKS },
		},
	},
	request,
}: ActionFunctionArgs) {
	const userId = await requireUserId(storageContext, request)
	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: ChangeEmailSchema.superRefine(async (data, ctx) => {
			const existingUser = await storageContext.db.user.findUnique({
				where: { email: data.email },
			})
			if (existingUser) {
				ctx.addIssue({
					path: ['email'],
					code: z.ZodIssueCode.custom,
					message: 'This email is already in use.',
				})
			}
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
	}
	const { otp, redirectTo, verifyUrl } = await prepareVerification({
		storageContext,
		period: 10 * 60,
		request,
		target: userId,
		type: 'change-email',
	})

	const response = await sendEmail(RESEND_API_KEY, MOCKS, {
		to: submission.value.email,
		subject: `MixDown! Email Change Verification`,
		react: <EmailChangeEmail verifyUrl={verifyUrl.toString()} otp={otp} />,
	})

	if (response.status === 'success') {
		const verifySession = await storageContext.verificationSessionStorage.getSession()
		verifySession.set(newEmailAddressSessionKey, submission.value.email)
		return redirect(redirectTo.toString(), {
			headers: {
				'set-cookie': await storageContext.verificationSessionStorage.commitSession(verifySession),
			},
		})
	} else {
		return json(
			{
				result: submission.reply({ formErrors: [response.error.message] }),
			},
			{
				status: 500,
			},
		)
	}
}

export function EmailChangeEmail({ verifyUrl, otp }: { verifyUrl: string; otp: string }) {
	return (
		<Html lang="en" dir="ltr">
			<Container>
				<h1>
					<Text>MixDown! Email Change</Text>
				</h1>
				<p>
					<Text>
						Here&apos;s your verification code: <strong>{otp}</strong>
					</Text>
				</p>
				<p>
					<Text>Or click the link:</Text>
				</p>
				<Link href={verifyUrl}>{verifyUrl}</Link>
			</Container>
		</Html>
	)
}

export function EmailChangeNoticeEmail({ userId }: { userId: string }) {
	return (
		<Html lang="en" dir="ltr">
			<Container>
				<h1>
					<Text>Your MixDown! email has been changed</Text>
				</h1>
				<p>
					<Text>We&apos;re writing to let you know that your MixDown! email has been changed.</Text>
				</p>
				<p>
					<Text>
						If you changed your email address, then you can safely ignore this. But if you did not change your email
						address, then please contact support immediately.
					</Text>
				</p>
				<p>
					<Text>Your Account ID: {userId}</Text>
				</p>
			</Container>
		</Html>
	)
}

export default function ChangeEmailIndex() {
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()

	const [form, fields] = useForm({
		id: 'change-email-form',
		constraint: getZodConstraint(ChangeEmailSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ChangeEmailSchema })
		},
	})

	const isPending = useIsPending()
	return (
		<div>
			<h1 className="text-h1">Change Email</h1>
			<p>You will receive an email at the new email address to confirm.</p>
			<p>An email notice will also be sent to your old address {data.user.email}.</p>
			<div className="mx-auto mt-5 max-w-sm">
				<Form method="POST" {...getFormProps(form)}>
					<Field
						labelProps={{ children: 'New Email' }}
						inputProps={{
							...getInputProps(fields.email, { type: 'email' }),
							autoComplete: 'email',
						}}
						errors={fields.email.errors}
					/>
					<ErrorList id={form.errorId} errors={form.errors} />
					<div>
						<StatusButton status={isPending ? 'pending' : form.status ?? 'idle'}>Send Confirmation</StatusButton>
					</div>
				</Form>
			</div>
		</div>
	)
}
