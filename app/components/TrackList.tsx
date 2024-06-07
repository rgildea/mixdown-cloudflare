import { PlayerDispatchContext } from '#app/contexts/PlayerContext'
import { TrackWithVersions } from '#app/utils/track.server'
import { Link } from '@remix-run/react'
import { useContext } from 'react'
import DataTable from '#app/components/DataTableBase'
import { Button } from './ui/button'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { useIsPending } from '#app/utils/misc'
import TrackCell from './TrackCell'

interface TrackListProps {
	tracks: TrackWithVersions[]
	onTrackDeleted?: (track: TrackWithVersions) => void
	onRowClicked?: (track: TrackWithVersions) => void
}

function TrackList({ tracks }: TrackListProps) {
	const dispatch = useContext(PlayerDispatchContext)
	const isPending = useIsPending()

	const handlePlayButtonClicked = (track: TrackWithVersions) => {
		console.log(track)
		dispatch({ type: 'PLAY_TRACK', track })
	}

	const customStyles = {
		rows: {
			style: {
				borderRadius: '0.5rem',
			},
			stripedStyle: {
				backgroundColor: 'rgba(252, 103, 54, 0.9)',
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
			cell: track => <TrackCell track={track} />,
		},
	]

	const noDataComponent = (
		<div className="flex-col">
			<Button className="my-2 bg-secondary text-button text-secondary-foreground" asChild variant="default" size="icon">
				<Link to="/tracks/?new=true">
					<InlineIcon className="size-48" icon="mdi:cloud-upload" />
				</Link>
			</Button>
			{/* <InlineIcon className="size-48" icon="mdi:cloud-upload" /> */}
			<div>Upload a track to get started.</div>
		</div>
	)

	return (
		<DataTable
			progressPending={isPending}
			noDataComponent={noDataComponent}
			highlightOnHover
			pointerOnHover
			striped
			onRowClicked={row => {
				handlePlayButtonClicked(row)
			}}
			columns={cols}
			data={tracks}
			theme="mixdown"
			customStyles={customStyles}
			noTableHead
		/>
	)
}

export default TrackList
