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
				className="space-between group mx-0 flex h-16 w-full flex-nowrap items-center justify-between"
				data-tag="allowRowEvents"
			>
				<PlayButton size="large" track={track} />
				<div
					className="flex-1 font-nourd text-body-sm font-semibold leading-snug group-hover:font-extrabold"
					data-tag="allowRowEvents"
				>
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
