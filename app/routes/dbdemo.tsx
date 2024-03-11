import { LoaderFunction } from '@remix-run/cloudflare'
import { json, useLoaderData } from '@remix-run/react'
import { getPrismaClient } from 'app/db'

export const loader: LoaderFunction = async ({ context }) => {
	const prisma = getPrismaClient(context.cloudflare.env.DATABASE_URL)
	const users = await prisma.user.findMany()
	return json({ users })
}

export default function DBDemo() {
	const loader = useLoaderData<typeof loader>()

	return (
		<div>
			<h1>DB Demo</h1>
			<ul>
				{loader.users.map(user => (
					<li key={user.id}>{user.name}</li>
				))}
			</ul>
		</div>
	)
}
