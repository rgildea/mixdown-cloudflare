import { CheckboxField, ErrorList, Field } from '#app/components/forms.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { StorageContext, requireAnonymous, sessionKey, signup } from '#app/utils/auth.server.ts'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
} from '@remix-run/cloudflare'
import { Form, useActionData, useLoaderData, useSearchParams } from '@remix-run/react'
import { HoneypotInputs } from 'remix-utils/honeypot/react'
import { safeRedirect } from 'remix-utils/safe-redirect'
import { z } from 'zod'
// import { checkHoneypot } from '#app/utils/honeypot.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { EmailSchema, NameSchema, PasswordAndConfirmPasswordSchema } from '#app/utils/user-validation.ts'

export const onboardingEmailSessionKey = 'onboardingEmail'

const SignupFormSchema = z
	.object({
		email: EmailSchema,
		name: NameSchema,
		agreeToTermsOfServiceAndPrivacyPolicy: z.boolean({
			required_error: 'You must agree to the terms of service and privacy policy',
		}),
		remember: z.boolean().optional(),
		redirectTo: z.string().optional(),
	})
	.and(PasswordAndConfirmPasswordSchema)

async function requireOnboardingEmail(storageContext: StorageContext, request: Request) {
	await requireAnonymous(storageContext, request)
	const verifySession = await storageContext.verificationSessionStorage.getSession(request.headers.get('cookie'))
	const email = verifySession.get(onboardingEmailSessionKey)
	if (typeof email !== 'string' || !email) {
		console.log("No onboarding email found, redirecting to '/signup'")
		throw redirect('/signup')
	}
	return email
}
export async function loader({ context: { storageContext }, request }: LoaderFunctionArgs) {
	const email = await requireOnboardingEmail(storageContext, request)
	return json({ email })
}

export async function action({ context: { storageContext }, request }: ActionFunctionArgs) {
	const { db, authSessionStorage, verificationSessionStorage, toastSessionStorage } = storageContext
	const email = await requireOnboardingEmail(storageContext, request)
	const formData = await request.formData()
	// checkHoneypot(formData)
	const submission = await parseWithZod(formData, {
		schema: intent =>
			SignupFormSchema.superRefine(async (data, ctx) => {
				const existingUser = await storageContext.db.user.findUnique({
					where: { email: data.email },
					select: { id: true },
				})
				if (existingUser) {
					ctx.addIssue({
						path: ['username'],
						code: z.ZodIssueCode.custom,
						message: 'A user already exists with this email address. Please log in instead.',
					})
					return
				}
			}).transform(async data => {
				if (intent !== null) return { ...data, session: null }

				const session = await signup({ ...data, db, email })
				return { ...data, session }
			}),
		async: true,
	})

	if (submission.status !== 'success' || !submission.value.session) {
		return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
	}

	const { session, remember, redirectTo } = submission.value

	const authSession = await authSessionStorage.getSession(request.headers.get('cookie'))
	authSession.set(sessionKey, session.id)
	const verifySession = await verificationSessionStorage.getSession()
	const headers = new Headers()
	headers.append(
		'set-cookie',
		await authSessionStorage.commitSession(authSession, {
			expires: remember ? session.expirationDate : undefined,
		}),
	)
	headers.append('set-cookie', await verificationSessionStorage.destroySession(verifySession))

	return redirectWithToast(
		toastSessionStorage,
		safeRedirect(redirectTo),
		{ title: 'Welcome', description: 'Thanks for signing up!' },
		{ headers },
	)
}

export const meta: MetaFunction = () => {
	return [{ title: 'Setup MixDown! Account' }]
}

export default function SignupRoute() {
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()
	const [searchParams] = useSearchParams()
	const redirectTo = searchParams.get('redirectTo')

	const [form, fields] = useForm({
		id: 'onboarding-form',
		constraint: getZodConstraint(SignupFormSchema),
		defaultValue: { redirectTo },
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: SignupFormSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container flex min-h-full flex-col justify-center pb-32 pt-20">
			<div className="mx-auto w-full max-w-lg">
				<div className="flex flex-col gap-3 text-center">
					<h1 className="text-h1">Welcome aboard {data.email}!</h1>
					<p className="text-body-md text-muted-foreground">Please enter your details.</p>
				</div>
				<Spacer size="xs" />
				<Form method="POST" className="mx-auto min-w-full max-w-sm sm:min-w-[368px]" {...getFormProps(form)}>
					<HoneypotInputs />
					{/* <Field
						labelProps={{ htmlFor: fields.username.id, children: 'Username' }}
						inputProps={{
							...getInputProps(fields.username, { type: 'text' }),
							autoComplete: 'username',
							className: 'lowercase',
						}}
						errors={fields.username.errors}
					/> */}
					<Field
						labelProps={{ htmlFor: fields.name.id, children: 'Name' }}
						inputProps={{
							...getInputProps(fields.name, { type: 'text' }),
							autoComplete: 'name',
						}}
						errors={fields.name.errors}
					/>
					<Field
						labelProps={{ htmlFor: fields.password.id, children: 'Password' }}
						inputProps={{
							...getInputProps(fields.password, { type: 'password' }),
							autoComplete: 'new-password',
						}}
						errors={fields.password.errors}
					/>

					<Field
						labelProps={{
							htmlFor: fields.confirmPassword.id,
							children: 'Confirm Password',
						}}
						inputProps={{
							...getInputProps(fields.confirmPassword, { type: 'password' }),
							autoComplete: 'new-password',
						}}
						errors={fields.confirmPassword.errors}
					/>

					<CheckboxField
						labelProps={{
							htmlFor: fields.agreeToTermsOfServiceAndPrivacyPolicy.id,
							children: 'Do you agree to our Terms of Service and Privacy Policy?',
						}}
						buttonProps={getInputProps(fields.agreeToTermsOfServiceAndPrivacyPolicy, { type: 'checkbox' })}
						errors={fields.agreeToTermsOfServiceAndPrivacyPolicy.errors}
					/>
					<CheckboxField
						labelProps={{
							htmlFor: fields.remember.id,
							children: 'Remember me',
						}}
						buttonProps={getInputProps(fields.remember, { type: 'checkbox' })}
						errors={fields.remember.errors}
					/>

					<input {...getInputProps(fields.redirectTo, { type: 'hidden' })} />
					<ErrorList errors={form.errors} id={form.errorId} />

					<div className="flex items-center justify-between gap-6">
						<StatusButton
							className="w-full"
							status={isPending ? 'pending' : form.status ?? 'idle'}
							type="submit"
							disabled={isPending}
						>
							Create an account
						</StatusButton>
					</div>
				</Form>
			</div>
		</div>
	)
}
