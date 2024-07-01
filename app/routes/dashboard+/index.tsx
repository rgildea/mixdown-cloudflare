import TrackList from '#app/components/TrackList'
import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardHeader } from '#app/components/ui/card'
import { PlayerDispatchContext } from '#app/contexts/PlayerContext'
import { TitleDispatchContext } from '#app/contexts/TitleContext'
import { loader } from '#app/routes/dashboard+/_layout'
import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { ActionFunction, json } from '@remix-run/cloudflare'
import { Link, useMatches, useRouteLoaderData } from '@remix-run/react'
import { useContext, useEffect } from 'react'
export const action: ActionFunction = async () => {
	return json({}, { status: 200 })
}

export default function Route() {
	const matches = useMatches()
	const match = matches.find(match => match.id == 'routes/dashboard+/_layout')
	const loaderData = useRouteLoaderData<typeof loader>(match?.id ?? '') as { tracks: TrackWithVersions[] }
	const playerDispatch = useContext(PlayerDispatchContext)
	const titleDispatch = useContext(TitleDispatchContext)

	const { tracks } = loaderData

	// set the title and icon for the page
	useEffect(() => {
		titleDispatch({ type: 'SET_TITLE', title: 'My Tracks', icon: 'mdi:home' })
		return () => {}
	})

	// load the first track if there is no track loaded
	useEffect(() => {
		playerDispatch({ type: 'SET_PLAYLIST', tracks })
		return () => {}
	}, [playerDispatch, tracks])

	// // load the first track if there is no track loaded
	// useEffect(() => {
	// 	if (playerState?.playlist.length && !playerState?.getCurrentTrack()) {
	// 		playerDispatch({ type: 'LOAD_TRACK', track: playerState.playlist[0] })
	// 	}
	// 	return () => {}
	// }, [playerState, playerDispatch])

	return (
		<Card className="min-h-screen/2 border-none shadow-none">
			<CardHeader className="flex flex-row items-end justify-between px-0 py-1">
				<Button asChild>
					<Link
						className="leading font-sans text-body-sm font-medium hover:font-semibold hover:text-white"
						to="?new=true"
					>
						<InlineIcon className="size-4" icon="mdi:plus-circle-outline" />
						&nbsp; Add Track
					</Link>
				</Button>
				{/* <Button className="bg-secondary text-button text-xs text-secondary-foreground" asChild size="icon">
					<Link to="?new=true">
						<InlineIcon className="size-4" icon="mdi:plus-circle-outline" />
						&nbsp; Add Track
					</Link>
				</Button> */}
			</CardHeader>
			<CardContent className="grow px-0">
				<TrackList tracks={tracks || []} />
			</CardContent>
		</Card>
	)
}
