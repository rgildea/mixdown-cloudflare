import { redirect, useLoaderData } from '@remix-run/react'

//action goes here

export const loader = async () => {
	console.log('track id index route')
	return redirect('versions')
}

export default function Route() {
	const loaderData = useLoaderData<typeof loader>()
	return loaderData
}
