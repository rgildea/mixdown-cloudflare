import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { Form, NavLink } from '@remix-run/react'
import PlayButton from './PlayButton'
import { Button } from './ui/button'

const TrackCell = ({ track }: { track: TrackWithVersions }) => {
	const audioFile = track.versions[0]?.audioFile
	const trackUrl = `/storage/${audioFile?.fileKey}`
	return (
		trackUrl && (
			<div
				className="space-between flex h-16 w-full flex-nowrap items-center justify-between px-0"
				data-tag="allowRowEvents"
			>
				<PlayButton size="large" track={track} />
				<div className="font-pixer flex-1 leading-snug" data-tag="allowRowEvents">
					{track.title}
				</div>
				<Button variant="playbutton" size={'icon'} asChild>
					<NavLink to={`/tracks/${track.id}?edit`}>
						<InlineIcon className="size-6" icon="mdi:pencil" />
					</NavLink>
				</Button>
				<Form key={track.id} method="DELETE" action={trackUrl}>
					<Button
						className="ml-auto p-0 text-button focus-visible:ring-0"
						type="submit"
						variant="playbutton-destructive"
						onClick={e => {
							e.stopPropagation()
							// onTrackDeleted(track)
						}}
						onSubmit={e => {
							e.preventDefault()
						}}
					>
						<InlineIcon className="size-6" icon="mdi:delete" />
					</Button>{' '}
				</Form>
			</div>
		)
	)
}

export default TrackCell
