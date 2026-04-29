import { requireUserId } from '#app/utils/auth.server'
import { getUserTracksWithVersionInfo } from '#app/utils/track.server'
import { ActionFunction, LoaderFunction, LoaderFunctionArgs, data as jsonResponse } from 'react-router'
import { Outlet } from 'react-router'

export const loader: LoaderFunction = async ({ context, request }: LoaderFunctionArgs) => {
	const userId = await requireUserId(context.storageContext, request)
	try {
		const tracks = await getUserTracksWithVersionInfo(context.storageContext, userId)

		return jsonResponse({ tracks })
	} catch (err) {
		console.error(err)
		throw new Response('Failed to list objects', { status: 500 })
	}
}

export const action: ActionFunction = async () => {
	return jsonResponse({}, { status: 200 })
}

export default function Route() {
	return (
		<>
			<Outlet />
		</>
	)
}
