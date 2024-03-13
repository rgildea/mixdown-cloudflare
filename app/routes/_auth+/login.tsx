import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'

import { SubmissionResult, getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { ActionFunctionArgs, json } from '@remix-run/cloudflare'
import { Form, useActionData } from '@remix-run/react'
import { z } from 'zod'
import { login } from '~/utils/session.server'
import { EmailSchema, PasswordSchema } from '~/utils/user-validation'

const LoginFormSchema = z.object(
	{
		email: EmailSchema,
		password: PasswordSchema,
	},
	{ required_error: 'Please fill in the required field' },
)

export async function action({ context: { db }, request }: ActionFunctionArgs) {
	const formData = await request.formData()
	// const submission = await parseWithZod(formData, { schema: LoginFormSchema });
	const submission = await parseWithZod(formData, {
		schema: intent =>
			LoginFormSchema.transform(async data => {
				if (intent !== null) return { ...data, session: null }

				// const session = await login(data)
				// if (!session) {
				// 	ctx.addIssue({
				// 		code: z.ZodIssueCode.custom,
				// 		message: 'Invalid username or password',
				// 	})
				// 	return z.NEVER
				// }

				return { ...data, session: null }
			}),
		async: true,
	})

	if (submission.status !== 'success') {
		return json(
			{ result: submission.reply({ hideFields: ['password'] }) },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	// // log the user in
	const user = await login({ db, email: submission.value.email, password: submission.value.password })
	// Return a form error if the message is not sent
	if (!user) {
		return json(
			{
				result: submission.reply({
					hideFields: ['password'],
					formErrors: ['Login failed. Please check your details and try again.'],
				}),
			},
			{ status: 400 },
		)
	}

	return json({ result: submission.reply({ hideFields: ['password'] }) }, { status: 200 })
}

export default function LoginPage() {
	const actionData = useActionData<typeof action>()
	// The useForm hook will return all the metadata we need to render the form
	// and focus on the first invalid field when the form is submitted

	console.log('actionData', actionData)

	const [form, fields] = useForm({
		id: 'login-form',
		constraint: getZodConstraint(LoginFormSchema),
		defaultValue: null,
		lastResult: actionData?.result as SubmissionResult<string[]>, // Fix: Cast actionData?.result to SubmissionResult<string[]>
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: LoginFormSchema })
		},
		shouldRevalidate: 'onBlur',
		// Validate field once user leaves the field
		shouldValidate: 'onBlur',
	})

	return (
		<div className="container h-full min-h-screen bg-slate-50">
			<Card className="mx-auto  w-full max-w-md text-card-foreground ">
				<Form method="post" {...getFormProps(form)}>
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
								className="text-md w-full border-b-2 focus-visible:placeholder-transparent focus-visible:outline-none"
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
								className="text-md w-full border-b-2 focus-visible:placeholder-transparent focus-visible:outline-none"
								placeholder="Password"
								{...getInputProps(fields.password, { type: 'password' })}
							/>
							<div id={fields.password.errorId} className="mt-1 h-1 text-xs font-semibold text-input-invalid">
								{fields.password.errors}
							</div>
						</div>
					</CardContent>
					<CardFooter>
						<Button type="submit" variant="outline">
							Submit
						</Button>
					</CardFooter>
				</Form>
			</Card>
		</div>
	)
}
