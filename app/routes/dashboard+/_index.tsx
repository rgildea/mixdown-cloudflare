import TrackList from '#app/components/TrackList'
import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardTitle } from '#app/components/ui/card'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { requireUserId } from '#app/utils/auth.server'
import { TrackWithVersions, getUserTracksWithVersionInfo } from '#app/utils/track.server'
import { ActionFunction, LoaderFunction, LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, Outlet, useLoaderData, useNavigate } from '@remix-run/react'
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
	const navigate = useNavigate()
	return (
		<>
			<MixdownPlayer />
			<Outlet />
			<Card className="sm:w-3/4">
				<CardTitle className=" px-6t m-4">
					<div className="flex h-max w-full justify-between">
						<div className="text-4xl font-extrabold">Dashboard</div>
						<Button className="bg-secondary text-button text-secondary-foreground" asChild variant="default" size="sm">
							<Link to="?new=true">
								<InlineIcon className="m-1 size-6" icon="akar-icons:plus" />
								New Track
							</Link>
						</Button>
					</div>
				</CardTitle>
				<CardContent>
					<TrackList
						tracks={tracks}
						onRowClicked={(track: TrackWithVersions) => {
							navigate(`/tracks/${track.id}`)
						}}
					/>
				</CardContent>
			</Card>
		</>
	)
}
