import TrackList from '#app/components/TrackList'
import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardTitle } from '#app/components/ui/card'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { requireUserId } from '#app/utils/auth.server'
import { TrackWithVersions, getUserTracksWithVersionInfo } from '#app/utils/track.server'
import { ActionFunction, LoaderFunction, LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import MixdownPlayer from '#app/components/MixdownPlayer'

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
			<MixdownPlayer />

			<Card className="flex flex-col space-y-4 p-2 sm:w-3/4">
				<CardTitle className=" m-4 px-6">
					{/* <div className="flex h-max w-full flex-wrap justify-between"> */}

					<div className="p-0 text-4xl font-extrabold">My Tracks</div>
					<Button
						className="my-2 bg-secondary text-button text-secondary-foreground"
						asChild
						variant="default"
						size="icon"
					>
						<Link to="/tracks/?new=true">
							<InlineIcon className="size-4" icon="akar-icons:cloud-upload" />
						</Link>
					</Button>
				</CardTitle>
				<CardContent>
					<TrackList tracks={tracks} />
				</CardContent>
			</Card>
		</>
	)
}
