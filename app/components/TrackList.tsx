import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { Form } from '@remix-run/react'

interface TrackListProps {
	tracks: TrackWithVersions[]
	setURL: (url: string) => void
}

function TrackList({ tracks, setURL }: TrackListProps) {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-around',
				border: '2px orange solid',
			}}
		>
			{tracks &&
				tracks.map((track, index) => {
					const audioFile = track.versions[0]?.audioFile
					const trackUrl = `/storage/${audioFile?.fileKey}`
					return (
						trackUrl && (
							<Form key={track.id} method="DELETE" action={trackUrl}>
								<div
									style={{
										display: 'flex',
										flexDirection: 'row',
										justifyContent: 'space-between',
										border: '1px black solid',
										cursor: 'pointer',
										padding: '20px',
										margin: '2px',
									}}
									onClick={() => {
										setURL(trackUrl)
									}}
									role="button"
									onKeyDown={e => e.key === 'Enter' && setURL(trackUrl)}
									tabIndex={index + 1}
								>
									<div style={{ flex: 10 }}>
										<InlineIcon icon="akar-icons:play"></InlineIcon>
										<span>{track.title}</span>
									</div>

									<button
										className="btn text-button"
										type="submit"
										onClick={e => {
											e.stopPropagation()
										}}
										onSubmit={e => {
											e.preventDefault()
										}}
									>
										<InlineIcon icon="akar-icons:cross" />
									</button>
								</div>
							</Form>
						)
					)
				})}
		</div>
	)
}

export default TrackList
