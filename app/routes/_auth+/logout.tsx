import { type ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare'
import { logout, requireUserId } from '#app/utils/auth.server.ts'
import { Form } from '@remix-run/react'

export async function loader({ context: { storageContext }, request }: LoaderFunctionArgs) {
	return requireUserId(storageContext, request, { redirectTo: '/' })
}

export async function action({
	context: {
		storageContext: { db, authSessionStorage },
	},
	request,
}: ActionFunctionArgs) {
	return logout({ db, authSessionStorage, request, redirectTo: '/' })
}

export default function LogoutRoute() {
	return (
		<Form method="post">
			<button type="submit">Logout</button>
		</Form>
	)
}
