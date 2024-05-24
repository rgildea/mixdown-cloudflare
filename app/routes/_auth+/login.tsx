import { CheckboxField } from '#app/components/forms'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#app/components/ui/card'
import { StatusButton } from '#app/components/ui/status-button'
import { login, requireAnonymous } from '#app/utils/auth.server'
import { useIsPending } from '#app/utils/misc'
import { handleNewSession } from '#app/utils/session.server'
import { EmailSchema, PasswordSchema } from '#app/utils/user-validation'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { ActionFunctionArgs, json } from '@remix-run/cloudflare'
import { Form, Link, useActionData, useSearchParams } from '@remix-run/react'
import { z } from 'zod'

const LoginFormSchema = z.object(
	{
		email: EmailSchema,
		password: PasswordSchema,
		redirectTo: z.string().optional(),
		remember: z.boolean().optional(),
	},
	{ required_error: 'Please fill in the required field' },
)

export async function action({ context: { storageContext }, request }: ActionFunctionArgs) {
	await requireAnonymous(storageContext, request)
	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: intent =>
			LoginFormSchema.transform(async (data, ctx) => {
				if (intent !== null) return { ...data, session: null }
				const session = await login({ db: storageContext.db, email: data.email, password: data.password })
				if (!session) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Invalid username or password',
					})
					return z.NEVER
				}

				return { ...data, session }
			}),
		async: true,
	})

	if (submission.status !== 'success' || !submission.value.session) {
		return json(
			{ result: submission.reply({ hideFields: ['password'] }) },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}
	const { session, remember, redirectTo } = submission.value
	return handleNewSession({
		storageContext,
		request,
		session,
		remember: remember ?? false,
		redirectTo: redirectTo || '/dashboard',
	})
}

export default function LoginPage() {
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()
	const [searchParams] = useSearchParams()
	const redirectTo = searchParams.get('redirectTo')
	const [form, fields] = useForm({
		id: 'login-form',
		constraint: getZodConstraint(LoginFormSchema),
		defaultValue: { redirectTo },
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: LoginFormSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container h-full min-h-screen">
			<Card className="mx-auto mt-16 w-full min-w-full  max-w-sm text-card-foreground sm:min-w-[368px]">
				<Form method="post" {...getFormProps(form)} onSubmit={form.onSubmit}>
					<CardHeader>
						<CardTitle className="text-4xl font-extrabold">Welcome Back!</CardTitle>
						<CardDescription>Please enter your login details.</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col space-y-8">
						<div id={form.errorId} className="text-s h-2 font-semibold text-input-invalid">
							{form.errors}
						</div>
						<div className="text-s h-2 font-semibold text-orange-500">
							{actionData?.result?.status === 'success' && 'Success!'}
						</div>
						<div>
							<input
								className="text-md w-full border-b-2 bg-card focus-visible:placeholder-transparent focus-visible:outline-none"
								defaultValue={fields.email.initialValue?.toString()}
								placeholder="Email Address"
								{...getInputProps(fields.email, { type: 'email' })}
							/>
							<div id={fields.email.errorId} className="mt-1 h-1 text-xs font-semibold text-input-invalid">
								{fields.email.errors}
							</div>
						</div>
						<div>
							<input
								className="text-md w-full border-b-2 bg-card focus-visible:placeholder-transparent focus-visible:outline-none"
								placeholder="Password"
								{...getInputProps(fields.password, { type: 'password' })}
							/>
							<div id={fields.password.errorId} className="mt-1 h-1 text-xs font-semibold text-input-invalid">
								{fields.password.errors}
							</div>
						</div>
						<div className="flex justify-between">
							<CheckboxField
								labelProps={{
									htmlFor: fields.remember.id,
									children: 'Remember me',
								}}
								buttonProps={getInputProps(fields.remember, {
									type: 'checkbox',
								})}
								errors={fields.remember.errors}
							/>
							<div>
								<Link to="/forgot-password" className="text-body-xs font-semibold">
									Forgot password?
								</Link>
							</div>
						</div>
					</CardContent>
					<CardFooter>
						<StatusButton
							className="w-full"
							status={isPending ? 'pending' : form.status ?? 'idle'}
							type="submit"
							disabled={isPending}
						>
							Log in
						</StatusButton>
					</CardFooter>
				</Form>
			</Card>
		</div>
	)
}
