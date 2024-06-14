import MixdownPlayer from '#app/components/MixdownPlayer'
import TrackList from '#app/components/TrackList'
import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardHeader } from '#app/components/ui/card'
import { PlayerContext } from '#app/contexts/PlayerContext'
import { TitleDispatchContext } from '#app/contexts/TitleContext'
import { loader } from '#app/routes/dashboard+/_layout'
import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { ActionFunction, json } from '@remix-run/cloudflare'
import { Link, useMatches, useRouteLoaderData } from '@remix-run/react'
import { AnimatePresence } from 'framer-motion'
import { useContext, useEffect } from 'react'
export const action: ActionFunction = async () => {
	return json({}, { status: 200 })
}
// export function meta() {
// 	return {
// 		title: 'Dashboard',
// 		description: 'Dashboard',
// 	}
// }

export default function Route() {
	const matches = useMatches()
	const match = matches.find(match => match.id == 'routes/dashboard+/_layout')
	const loaderData = useRouteLoaderData<typeof loader>(match?.id ?? '') as { tracks: TrackWithVersions[] }
	const dispatch = useContext(TitleDispatchContext)
	const { tracks } = loaderData
	const playerState = useContext(PlayerContext)
	const url = playerState?.track?.versions[0]?.audioFile?.url

	useEffect(() => {
		dispatch({ type: 'SET_TITLE', title: 'Dashboard', icon: 'mdi:home' })
		return () => {}
	})

	return (
		<Card className="border-none shadow-none">
			<CardHeader className="flex flex-row items-end justify-between px-0 py-1">
				{/* <CardTitle className="flex flex-nowrap items-center justify-self-end text-4xl">
					<InlineIcon className="" icon="mdi:home" />
					&nbsp;My Tracks
				</CardTitle> */}
				<Button className="bg-secondary text-button text-xs text-secondary-foreground" asChild size="icon">
					<Link to="?new=true">
						<InlineIcon className="size-4" icon="mdi:plus-circle-outline" />
						&nbsp; Add Track
					</Link>
				</Button>
			</CardHeader>
			<CardContent className="px-0">
				<TrackList tracks={tracks || []} />
				<AnimatePresence>
					URL: {url}
					<MixdownPlayer url={url} />
				</AnimatePresence>
			</CardContent>
		</Card>
	)
}
