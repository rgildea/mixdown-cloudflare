import { redirect, useLoaderData } from '@remix-run/react'

export const loader = async () => {
	return redirect('/dashboard')
}

export default function Route() {
	const loaderData = useLoaderData<typeof loader>()
	return loaderData
}
