import MixdownPlayer from '#app/components/MixdownPlayer'
import TrackList from '#app/components/TrackList'
import { Button } from '#app/components/ui/button'
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

	// load the playlist into the player context
	useEffect(() => {
		playerDispatch({ type: 'SET_PLAYLIST', tracks })
		return () => {}
	}, [playerDispatch, tracks])

	return (
		<div className="flex grow flex-col items-start gap-1 px-0">
			<Button asChild>
				<Link
					className="leading font-sans text-body-sm font-medium hover:font-semibold hover:text-white"
					to="?new=true"
				>
					<InlineIcon className="size-4" icon="mdi:plus-circle-outline" />
					&nbsp; Add Track
				</Link>
			</Button>
			<MixdownPlayer key="player" embed={true} />
			<TrackList tracks={tracks || []} />
		</div>
	)
}
