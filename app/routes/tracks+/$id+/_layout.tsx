import { LoaderFunction } from '@remix-run/cloudflare'
import { Outlet } from '@remix-run/react'

export const loader: LoaderFunction = async () => {
	return { message: 'This is a message from the loader.' }
}

export default function Route() {
	return (
		<div>
			<Outlet />
		</div>
	)
}
