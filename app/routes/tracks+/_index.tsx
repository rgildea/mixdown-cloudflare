import TrackList from '#app/components/TrackList'
import { Card, CardContent, CardTitle } from '#app/components/ui/card'
import { requireUserId } from '#app/utils/auth.server'
import { TrackWithVersions, getUserTracksWithVersionInfo } from '#app/utils/track.server'
import { ActionFunction, LoaderFunction, LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, Outlet, useLoaderData } from '@remix-run/react'

export const loader: LoaderFunction = async ({ context, request }: LoaderFunctionArgs) => {
	const userId = await requireUserId(context.storageContext, request)
	try {
		const tracks = await getUserTracksWithVersionInfo(context.storageContext, userId)

		return json({ tracks })
	} catch (err) {
		console.error(err)
		throw new Response('Failed to list objects', { status: 500 })
	}
}

export const action: ActionFunction = async () => {
	return json({}, { status: 200 })
}

export default function Route() {
	const { tracks } = useLoaderData<typeof loader>() as { tracks: TrackWithVersions[] }

	return (
		<>
			<Outlet />
			<Card className="rounded-xl border-y-2">
				<CardTitle>Track List</CardTitle>
				<CardContent>
					<Link to="/tracks/new" className="text-purple-600 underline hover:text-purple-700">
						New Track
					</Link>
					<TrackList
						setURL={() => {
							console.log('setURL')
						}}
						onTrackDeleted={() => {
							console.log('track deleted')
						}}
						tracks={tracks}
					/>

					{/* {tracks.map(track => (
						<div key={track.id} className="my-2 flex flex-col content-between bg-neutral-400 px-2">
							<p className="text-sm text-gray-500">ID: {track.id}</p>
							<p className="text-sm text-gray-500">Name: {track.title}</p>
							<p className="text-sm text-gray-500">Url: {track.versions[0]?.audioFile?.url}</p>
							<p className="text-sm text-gray-500">Version: ({track.versions.length})</p>
						</div>
					))} */}
				</CardContent>
			</Card>
		</>
	)
}
