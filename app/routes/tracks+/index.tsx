import { redirect, useLoaderData } from 'react-router'

export const loader = async () => {
	return redirect('/dashboard')
}

export default function Route() {
	const loaderData = useLoaderData<typeof loader>()
	return loaderData
}
