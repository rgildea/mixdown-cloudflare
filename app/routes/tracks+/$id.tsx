import { Card } from '#app/components/ui/card'
import { TrackWithVersions, getTrackWithVersionsByTrackId } from '#app/utils/track.server'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Outlet, useLoaderData } from '@remix-run/react'

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
	const notFoundResponse = new Response('Not found', { status: 404 })
	const trackId = params.id as string
	console.info(params)
	console.info('Found trackId in loader', trackId)

	if (!trackId) {
		console.warn('No trackId')
		return notFoundResponse
	}
	console.info('querying for track')
	const track: TrackWithVersions = await getTrackWithVersionsByTrackId(context.storageContext, trackId)
	console.info(track ? 'Found track' : 'Track not found')
	if (!track) {
		console.warn('No track found')
		return notFoundResponse
	}
	return json({ track })
}

export default function TrackRoute() {
	const { track } = useLoaderData<typeof loader>() as { track: TrackWithVersions }

	return (
		<Card className=" mx-auto flex flex-col items-center justify-center sm:w-3/4">
			<h1>{track?.title}</h1>
			<h2>
				{track?.versions.length} version{track?.versions.length > 1 ? 's' : ''}
			</h2>
			<Outlet />
		</Card>
	)
}
