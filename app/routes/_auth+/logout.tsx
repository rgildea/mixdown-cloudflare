import { type ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'
import { logout, requireUserId } from '#app/utils/auth.server.ts'
import { Form } from 'react-router'

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
