import DataTable from '#app/components/DataTableBase'
import { useIsPending } from '#app/utils/misc'
import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { Link, useNavigate } from '@remix-run/react'
import TrackCell from './TrackCell'
import { Button } from './ui/button'

interface TrackListProps {
	tracks: TrackWithVersions[]
	onTrackDeleted?: (track: TrackWithVersions) => void
	onRowClicked?: (track: TrackWithVersions) => void
}

function TrackList({ tracks }: TrackListProps) {
	// const dispatch = useContext(PlayerDispatchContext)
	const isPending = useIsPending()

	// const handlePlayButtonClicked = (track: TrackWithVersions, e: React.SyntheticEvent) => {
	// 	dispatch({ type: 'PLAY_TRACK', track, event: e })
	// }

	const customStyles = {
		rows: {
			style: {
				borderRadius: '0.5rem',
			},
			stripedStyle: {
				backgroundColor: '#F3F4F6',
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

	const navigate = useNavigate()

	return (
		<DataTable
			progressPending={isPending}
			noDataComponent={noDataComponent}
			highlightOnHover
			pointerOnHover
			onRowClicked={row => {
				navigate(`/tracks/${row.id}`)
			}}
			columns={cols}
			data={tracks}
			theme="mixdown"
			customStyles={customStyles}
			noTableHead
			noHeader
			noContextMenu
			fixedHeaderScrollHeight={'100%-2.5rem'}
		/>
	)
}

export default TrackList
