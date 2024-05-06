import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Html } from '@react-email/html'
import { Container } from '@react-email/container'
import { Text } from '@react-email/text'
import { Link } from '@react-email/link'
import { json, redirect, type ActionFunctionArgs, type MetaFunction } from '@remix-run/cloudflare'
import { Form, useActionData, useSearchParams } from '@remix-run/react'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { ProviderConnectionForm, providerNames } from '#app/utils/connections.tsx'
import { sendEmail } from '#app/utils/email.server.ts'
import { checkHoneypot } from '#app/utils/honeypot.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { EmailSchema } from '#app/utils/user-validation.ts'
import { prepareVerification } from '#app/utils/verification.server.ts'

const SignupSchema = z.object({
	email: EmailSchema,
})

export async function action({
	context: {
		storageContext,
		cloudflare: {
			env: { RESEND_API_KEY, MOCKS, HONEYPOT_SECRET },
		},
	},
	request,
}: ActionFunctionArgs) {
	const formData = await request.formData()
	const { db } = storageContext
	checkHoneypot(formData, HONEYPOT_SECRET)

	const submission = await parseWithZod(formData, {
		schema: SignupSchema.superRefine(async (data, ctx) => {
			const existingUser = await db.user.findUnique({
				where: { email: data.email },
				select: { id: true },
			})
			if (existingUser) {
				ctx.addIssue({
					path: ['email'],
					code: z.ZodIssueCode.custom,
					message: 'A user already exists with this email',
				})
				return
			}
		}),
		async: true,
	})
	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
	}
	const { email } = submission.value
	const { verifyUrl, redirectTo, otp } = await prepareVerification({
		storageContext,
		period: 10 * 60,
		request,
		type: 'onboarding',
		target: email,
	})

	const response = await sendEmail(RESEND_API_KEY, MOCKS, {
		to: email,
		subject: `Welcome to MixDown!!`,
		react: <SignupEmail onboardingUrl={verifyUrl.toString()} otp={otp} />,
	})

	if (response.status === 'success') {
		return redirect(redirectTo.toString())
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

export function SignupEmail({ onboardingUrl, otp }: { onboardingUrl: string; otp: string }) {
	return (
		<Html lang="en" dir="ltr">
			<Container>
				<h1>
					<Text>Welcome to MixDown!!</Text>
				</h1>
				<p>
					<Text>
						Here&apos;s your verification code: <strong>{otp}</strong>
					</Text>
				</p>
				<p>
					<Text>Or click the link to get started:</Text>
				</p>
				<Link href={onboardingUrl}>{onboardingUrl}</Link>
			</Container>
		</Html>
	)
}

export const meta: MetaFunction = () => {
	return [{ title: 'Sign Up | MixDown!' }]
}

export default function SignupRoute() {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()
	const [searchParams] = useSearchParams()
	const redirectTo = searchParams.get('redirectTo')

	const [form, fields] = useForm({
		id: 'signup-form',
		constraint: getZodConstraint(SignupSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			const result = parseWithZod(formData, { schema: SignupSchema })
			return result
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container flex flex-col justify-center pb-32 pt-20">
			<div className="text-center">
				<h1 className="text-h1">Let&apos;s start your journey!</h1>
				<p className="mt-3 text-body-md text-muted-foreground">Please enter your email.</p>
			</div>
			<div className="mx-auto mt-16 min-w-full max-w-sm sm:min-w-[368px]">
				<Form method="POST" {...getFormProps(form)}>
					<HoneypotInputs />
					<Field
						labelProps={{
							htmlFor: fields.email.id,
							children: 'Email',
						}}
						inputProps={{
							...getInputProps(fields.email, { type: 'email' }),
							autoFocus: true,
							autoComplete: 'email',
						}}
						errors={fields.email.errors}
					/>
					<ErrorList errors={form.errors} id={form.errorId} />
					<StatusButton
						className="w-full"
						status={isPending ? 'pending' : form.status ?? 'idle'}
						type="submit"
						disabled={isPending}
					>
						Submit
					</StatusButton>
				</Form>

				{!providerNames.length || (
					<ul className="mt-5 flex flex-col gap-5 border-b-2 border-t-2 border-border py-3">
						{providerNames.map(providerName => (
							<li key={providerName}>
								<ProviderConnectionForm type="Signup" providerName={providerName} redirectTo={redirectTo} />
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
