import { getCurrentTrack, PlayerContext } from '#app/contexts/PlayerContext'
import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { Form, NavLink } from '@remix-run/react'
import { useContext } from 'react'
import PlayButton from './PlayButton'
import { Button } from './ui/button'

const TrackCell = ({ track }: { track: TrackWithVersions }) => {
	const audioFile = track.versions[0]?.audioFile
	const trackUrl = `/storage/${audioFile?.fileKey}`
	const playerState = useContext(PlayerContext)
	const nowPlayingTrack = getCurrentTrack(playerState)

	const isTrackLoaded = nowPlayingTrack?.id === track?.id

	return (
		trackUrl && (
			<div
				className={`${isTrackLoaded ? 'primary-foreground bg-primary' : ''} space-between group mx-0 flex h-20 w-full flex-nowrap items-center justify-between rounded-sm px-0  sm:h-16`}
				data-tag="allowRowEvents"
			>
				<PlayButton size="sm" track={track} />
				<div
					className="leading flex-1 font-sans text-body-sm font-medium group-hover:font-semibold group-hover:-tracking-tighter group-hover:text-white"
					data-tag="allowRowEvents"
				>
					{track.title}
				</div>
				<Button variant="playbutton" size={'trackrow'} asChild>
					<NavLink to={`/tracks/${track.id}?edit`}>
						<InlineIcon className="size-4 sm:size-6" icon="mdi:pencil" />
					</NavLink>
				</Button>
				<Form key={track.id} method="DELETE" action={trackUrl}>
					<Button
						className="ml-auto p-0 text-button focus-visible:ring-0"
						type="submit"
						variant="playbutton-destructive"
						onClick={e => {
							e.stopPropagation()
						}}
						onSubmit={e => {
							e.preventDefault()
						}}
					>
						<InlineIcon className="size-6 sm:size-4" icon="mdi:delete" />
					</Button>{' '}
				</Form>
			</div>
		)
	)
}

export default TrackCell
