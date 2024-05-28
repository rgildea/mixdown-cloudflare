import { PlayerDispatchContext } from '#app/contexts/PlayerContext'
import { TrackWithVersions } from '#app/utils/track.server'
import { Form, NavLink } from '@remix-run/react'
import { useContext } from 'react'
import DataTable from '#app/components/DataTableBase'
import { Button } from './ui/button'
import { InlineIcon } from '@iconify/react/dist/iconify.js'

interface TrackListProps {
	tracks: TrackWithVersions[]
	onTrackDeleted?: (track: TrackWithVersions) => void
	onRowClicked?: (track: TrackWithVersions) => void
}

export const getLatestVersionUrl = (trackId: string, tracks: TrackWithVersions[]) => {
	const found = tracks.find(track => track.id == trackId)
	return found?.versions[0].audioFile?.url
}

function TrackList({ tracks, onRowClicked }: TrackListProps) {
	const dispatch = useContext(PlayerDispatchContext)

	const handlePlayButtonClicked = (trackId: string) => {
		const url = getLatestVersionUrl(trackId, tracks)
		console.log('Dispatching play action with url: ', url)
		dispatch({ type: 'PLAY', url })
	}

	const customStyles = {
		rows: {
			stripedStyle: {
				backgroundColor: 'rgba(252, 103, 54, 0.7)',
			},
		},
		headRow: {
			style: {
				border: '12px',
			},
		},
		headCells: {
			style: {
				backgroundColor: '#ECEFEF',
				color: '#202124',
				fontSize: '14px',
			},
		},
		pagination: {
			style: {
				border: 'none',
			},
		},
	}

	const cols: { name: string; selector: (row: TrackWithVersions) => any; cell?: (row: TrackWithVersions) => any }[] = [
		{
			name: 'title',
			selector: row => row?.id,
			cell: track => {
				const audioFile = track.versions[0]?.audioFile
				const trackUrl = `/storage/${audioFile?.fileKey}`
				return (
					trackUrl && (
						<div
							className="space-between flex w-full flex-nowrap items-center justify-between px-0 text-body-sm"
							data-tag="allowRowEvents"
						>
							<Button
								variant="ghost"
								onClick={e => {
									console.info('setting track id', track.id)
									e.stopPropagation()
									handlePlayButtonClicked(track.id)
								}}
								className="flex-6 p-1"
							>
								<InlineIcon className="size-4" icon="akar-icons:play"></InlineIcon>
							</Button>
							<div className="font-pixer flex-1 leading-snug" data-tag="allowRowEvents">
								{track.title}
							</div>
							<Button variant="ghost" asChild>
								<NavLink to={`${track.id}?edit`}>
									<InlineIcon className="size-4" icon="akar-icons:pencil" />
								</NavLink>
							</Button>

							<Form key={track.id} method="DELETE" action={trackUrl}>
								<Button
									className="flex-6 ml-auto p-0 text-button focus-visible:ring-0"
									type="submit"
									variant="ghost"
									onClick={e => {
										e.stopPropagation()
										// onTrackDeleted(track)
									}}
									onSubmit={e => {
										e.preventDefault()
									}}
								>
									<InlineIcon className="size-4" icon="akar-icons:cross" />
								</Button>{' '}
							</Form>
						</div>
					)
				)
			},
		},
	]
	console.log('Datatable is a ', typeof DataTable)
	console.log('tracks', tracks)
	return (
		<DataTable
			highlightOnHover
			pointerOnHover
			striped
			onRowClicked={onRowClicked}
			columns={cols}
			data={tracks}
			theme="mixdown"
			customStyles={customStyles}
		/>
	)
}

export default TrackList
