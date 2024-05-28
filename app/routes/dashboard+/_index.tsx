import MixdownPlayer from '#app/components/MixdownPlayer'
import TrackList from '#app/components/TrackList'
import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '#app/components/ui/card'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { requireUserId } from '#app/utils/auth.server'
import { TrackWithVersions, getUserTracksWithVersionInfo } from '#app/utils/track.server'
import { ActionFunction, LoaderFunction, LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, Outlet, useLoaderData, useRevalidator } from '@remix-run/react'

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

const getLatestVersionUrl = (track: TrackWithVersions) => {
	const audioFile = track.versions[0]?.audioFile
	return audioFile?.url
}
export default function Route() {
	const { tracks } = useLoaderData<typeof loader>() as { tracks: TrackWithVersions[] }
	const revalidator = useRevalidator()

	return (
		<>
			<Outlet />
			<Card className="m-0 h-full w-full p-0 sm:m-4 sm:min-h-dvh sm:w-3/4 sm:p-6">
				<MixdownPlayer />
				<CardTitle className="text-l text-primary">Track List</CardTitle>
				<CardDescription className="text-sm text-secondary">
					Note: Only the latest version of each track is shown here.
				</CardDescription>

				<CardContent className=" sm:max-width-full text-md">
					<Button asChild className="m-1" variant="outline" size="icon">
						<Link to="/tracks/new">
							<InlineIcon icon="akar-icons:plus" />
						</Link>
					</Button>
					<TrackList
						tracks={tracks}
						setURL={setCurrentFileURL}
						onTrackDeleted={track => {
							if (getLatestVersionUrl(track) === currentFileURL) {
								setCurrentFileURL(undefined)
								revalidator.revalidate()
							}
						}}
					/>
				</CardContent>
			</Card>
		</>
	)
}
