import MixdownPlayer from '#app/components/MixdownPlayer'
import TrackList from '#app/components/TrackList'
import UppyDragDropUploadForm from '#app/components/UppyDragDropUploadForm'
import { Card, CardContent, CardDescription, CardTitle } from '#app/components/ui/card'
import { requireUserId } from '#app/utils/auth.server'
import { TrackWithVersions, getUserTracksWithVersionInfo } from '#app/utils/track.server'
import { LoaderFunction, LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData, useRevalidator } from '@remix-run/react'
import { useState } from 'react'
import 'react-h5-audio-player/lib/styles.css'

export const loader = (async ({ context: { storageContext }, request }: LoaderFunctionArgs) => {
	const userId = await requireUserId(storageContext, request)
	const tracks = await getUserTracksWithVersionInfo(storageContext, userId)
	return json({ tracks })
}) satisfies LoaderFunction

export default function Index() {
	const { tracks } = useLoaderData<typeof loader>()

	const [currentFileURL, setCurrentFileURL] = useState<string>()
	const uploadEndpoint = '/storage/new'
	const revalidator = useRevalidator()

	return (
		tracks && (
			<Card className="w-1/2 p-6">
				<CardTitle>My Tracks</CardTitle>
				<CardDescription className="mb-4">Upload your tracks and listen to them here!</CardDescription>
				<CardContent className="mb-4">
					<p className="text-sm text-gray-500">Note: Only the latest version of each track is shown here.</p>
					<MixdownPlayer url={currentFileURL} />
					<TrackList
						tracks={tracks}
						setURL={setCurrentFileURL}
						onTrackDeleted={track => {
							if (getLatestVersionUrl(track) === currentFileURL) {
								setCurrentFileURL(undefined)
							}
						}}
					/>
					<UppyDragDropUploadForm
						className="mt-4"
						onSuccess={() => {
							revalidator.revalidate()
						}}
						endpoint={uploadEndpoint}
					/>
				</CardContent>
			</Card>
		)
	)
}

const getLatestVersionUrl = (track: TrackWithVersions) => {
	const audioFile = track.versions[0]?.audioFile
	return audioFile?.url
}
