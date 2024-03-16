import { LoaderFunctionArgs } from '@remix-run/cloudflare'
import { json, useLoaderData } from '@remix-run/react'
console.log('Hello from dbdemo.tsx')
export async function loader({
	context: {
		storageContext: { db },
	},
}: LoaderFunctionArgs) {
	const users = await db.user.findMany()
	return json({ users })
}

export default function DBDemo() {
	const { users } = useLoaderData<typeof loader>()

	return (
		<div>
			<h1>DB Demo</h1>
			<ul>
				{users.map(user => (
					<li key={user.id}>{user.email}</li>
				))}
			</ul>
		</div>
	)
}
