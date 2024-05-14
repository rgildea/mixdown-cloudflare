import MixdownPlayer from '#app/components/MixdownPlayer'
import TrackList from '#app/components/TrackList'
import UppyDragDropUploadForm from '#app/components/UppyDragDropUploadForm'
import { requireUserId } from '#app/utils/auth.server'
import { getUserTracksWithVersionInfo } from '#app/utils/track.server'
import { LoaderFunction, LoaderFunctionArgs, json, type MetaFunction } from '@remix-run/cloudflare'
import { useLoaderData, useRevalidator } from '@remix-run/react'
import { useState } from 'react'
import 'react-h5-audio-player/lib/styles.css'

export const loader = (async ({ context: { storageContext }, request }: LoaderFunctionArgs) => {
	const userId = await requireUserId(storageContext, request)
	const tracks = await getUserTracksWithVersionInfo(storageContext, userId)
	return json({ tracks })
}) satisfies LoaderFunction

export const meta: MetaFunction = (() => {
	return [
		{ title: 'Mixdown Music Player Demo' },
		{
			name: 'description',
			content: 'Welcome to Mixdown Music Player Demo!',
		},
	]
}) satisfies MetaFunction

export default function Index() {
	const { tracks } = useLoaderData<typeof loader>()

	const [currentFileURL, setCurrentFileURL] = useState<string>()
	const uploadEndpoint = '/storage/new'
	const revalidator = useRevalidator()

	return (
		tracks && (
			<div className="w-1/2">
				<h1>Welcome to Mixdown!</h1>
				<h2>Files</h2>
				<MixdownPlayer url={currentFileURL} />
				<TrackList tracks={tracks} setURL={setCurrentFileURL} />
				<UppyDragDropUploadForm
					onSuccess={() => {
						revalidator.revalidate()
					}}
					endpoint={uploadEndpoint}
				/>
			</div>
		)
	)
}
