import MixdownPlayer from '#app/components/MixdownPlayer'
import TrackList from '#app/components/TrackList'
import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#app/components/ui/card'
import { loader } from '#app/routes/dashboard+/_layout'
import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { ActionFunction, json } from '@remix-run/cloudflare'
import { Link, useMatches, useRouteLoaderData } from '@remix-run/react'
import { AnimatePresence } from 'framer-motion'
export const action: ActionFunction = async () => {
	return json({}, { status: 200 })
}

export default function Route() {
	const matches = useMatches()

	const match = matches.find(match => match.id == 'routes/dashboard+/_layout')
	const loaderData = useRouteLoaderData<typeof loader>(match?.id ?? '') as { tracks: TrackWithVersions[] }

	const { tracks } = loaderData
	return (
		<Card className="m-2 w-full border-none shadow-none">
			<CardHeader className="flex flex-row items-end justify-between px-0 py-1">
				{/* <div className="h-fit rounded-lg bg-blue-800 p-2 align-bottom text-white">Div 1</div>
				<div className="h-32 rounded-lg bg-blue-800 p-2 text-white">Div 2</div> */}
				<CardTitle className="flex flex-nowrap items-center justify-self-end text-4xl">
					<InlineIcon className="" icon="mdi:home" />
					&nbsp;My Tracks
				</CardTitle>
				<Button className="h-9 bg-secondary px-3 py-2 text-button text-secondary-foreground" asChild size="pill">
					<Link to="?new=true">
						<InlineIcon className="size-6" icon="mdi:plus-circle-outline" />
						&nbsp; Add Track
					</Link>
				</Button>
			</CardHeader>
			<CardContent className="px-0">
				<AnimatePresence>
					<MixdownPlayer />
				</AnimatePresence>

				<TrackList tracks={tracks || []} />
			</CardContent>
		</Card>
	)
}
