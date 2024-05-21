import MixdownPlayer from '#app/components/MixdownPlayer'
import { TrackWithVersions, getTrackWithVersionsByTrackId } from '#app/utils/track.server'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Outlet, useLoaderData } from '@remix-run/react'
import { useState } from 'react'

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
	const notFoundResponse = new Response('Not found', { status: 404 })
	const trackId = params.id as string
	console.log(params)
	console.log('Found trackId in loader', trackId)

	if (!trackId) {
		console.log('No trackId')
		return notFoundResponse
	}
	console.log('querying for track')
	const track: TrackWithVersions = await getTrackWithVersionsByTrackId(context.storageContext, trackId)
	console.log(track ? 'Found track' : 'Track not found')
	if (!track) {
		console.log('ugh, no track')
		return notFoundResponse
	}
	return json({ track })
}

export default function TrackRoute() {
	const { track } = useLoaderData<typeof loader>() as { track: TrackWithVersions }

	const url = track?.versions[0]?.audioFile?.url
	const [currentFileURL] = useState<string>(url || '')

	console.log('got track', track)
	return (
		<>
			<h1>{track?.title}</h1>
			<h2>
				{track?.versions.length} version{track.versions.length > 1 ? 's' : ''}
			</h2>
			<MixdownPlayer url={currentFileURL} />
			<Outlet />
		</>
	)
}
