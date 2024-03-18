import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { StorageContext, requireAnonymous, resetUserPassword } from '#app/utils/auth.server.ts'
import { useIsPending } from '#app/utils/misc.tsx'
import { PasswordAndConfirmPasswordSchema } from '#app/utils/user-validation.ts'
import { VerificationSessionKeys } from '#app/utils/verification.server'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
} from '@remix-run/cloudflare'
import { Form, useActionData, useLoaderData } from '@remix-run/react'

const ResetPasswordSchema = PasswordAndConfirmPasswordSchema

async function requireResetPasswordEmail(storageContext: StorageContext, request: Request) {
	await requireAnonymous(storageContext, request)
	const verifySession = await storageContext.verificationSessionStorage.getSession(request.headers.get('cookie'))
	const resetPasswordEmail = verifySession.get(VerificationSessionKeys['reset-password'])
	if (typeof resetPasswordEmail !== 'string' || !resetPasswordEmail) {
		throw redirect('/login')
	}
	return resetPasswordEmail
}

export async function loader({ context: { storageContext }, request }: LoaderFunctionArgs) {
	const resetPasswordEmail = await requireResetPasswordEmail(storageContext, request)
	return json({ resetPasswordUsername: resetPasswordEmail })
}

export async function action({ context: { storageContext }, request }: ActionFunctionArgs) {
	const resetPasswordEmail = await requireResetPasswordEmail(storageContext, request)
	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: ResetPasswordSchema,
	})
	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
	}
	const { password } = submission.value
	await resetUserPassword({ db: storageContext.db, email: resetPasswordEmail, password })
	const verifySession = await storageContext.verificationSessionStorage.getSession()
	return redirect('/login', {
		headers: {
			'set-cookie': await storageContext.verificationSessionStorage.destroySession(verifySession),
		},
	})
}

export const meta: MetaFunction = () => {
	return [{ title: 'Reset Password | MixDown!' }]
}

export default function ResetPasswordPage() {
	const data = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'reset-password',
		constraint: getZodConstraint(ResetPasswordSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ResetPasswordSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container flex flex-col justify-center pb-32 pt-20">
			<div className="text-center">
				<h1 className="text-h1">Password Reset</h1>
				<p className="mt-3 text-body-md text-muted-foreground">
					Hi, {data.resetPasswordUsername}. No worries. It happens all the time.
				</p>
			</div>
			<div className="mx-auto mt-16 min-w-full max-w-sm sm:min-w-[368px]">
				<Form method="POST" {...getFormProps(form)}>
					<Field
						labelProps={{
							htmlFor: fields.password.id,
							children: 'New Password',
						}}
						inputProps={{
							...getInputProps(fields.password, { type: 'password' }),
							autoComplete: 'new-password',
							autoFocus: true,
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

					<ErrorList errors={form.errors} id={form.errorId} />

					<StatusButton
						className="w-full"
						status={isPending ? 'pending' : form.status ?? 'idle'}
						type="submit"
						disabled={isPending}
					>
						Reset password
					</StatusButton>
				</Form>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
