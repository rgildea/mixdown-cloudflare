import MixdownPlayer from '#app/components/MixdownPlayer'
import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardTitle } from '#app/components/ui/card'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { requireUserId } from '#app/utils/auth.server'
import { TrackWithVersions, getUserTracksWithVersionInfo } from '#app/utils/track.server'
import { ActionFunction, LoaderFunction, LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Form, Link, NavLink, useLoaderData, useNavigate } from '@remix-run/react'
import { useState } from 'react'
import DataTable from '#app/components/DataTableBase'

export const loader: LoaderFunction = async ({ context, request }: LoaderFunctionArgs) => {
	const userId = await requireUserId(context.storageContext, request)
	try {
		const tracks = await getUserTracksWithVersionInfo(context.storageContext, userId)

		return json({ tracks })
	} catch (err) {
		console.error(err)
		throw new Response('Failed to list objects', { status: 500 })
	}
}

export const action: ActionFunction = async () => {
	return json({}, { status: 200 })
}

const getLatestVersionUrl = (trackId: string, tracks: TrackWithVersions[]) => {
	const found = tracks.find(track => track.id == trackId)
	return found?.versions[0].audioFile?.url
}

export default function Route() {
	const navigate = useNavigate()
	const { tracks } = useLoaderData<typeof loader>() as { tracks: TrackWithVersions[] }

	const [currentTrackId, setCurrentTrackId] = useState<string>()

	const customStyles = {
		rows: {
			// style: {
			// 	minHeight: '72px', // override the row height
			// },
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
						<div className="space-between flex w-full flex-nowrap items-center justify-between px-0 text-body-sm">
							<Button
								variant="ghost"
								onClick={e => {
									console.info('setting track id', track.id)
									e.stopPropagation()
									setCurrentTrackId(track.id)
								}}
								className="flex-6 p-1"
							>
								<InlineIcon className="size-4" icon="akar-icons:play"></InlineIcon>
							</Button>
							<div className="font-pixer flex-1 leading-snug">{track.title}</div>
							<Button variant="ghost" asChild>
								<NavLink to={`${track.id}?edit`}>
									<InlineIcon data-tag="allowRowEvents" className="size-4" icon="akar-icons:pencil" />
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
	return (
		<Card className=" sm:w-3/4">
			{currentTrackId && <MixdownPlayer url={getLatestVersionUrl(currentTrackId, tracks)} />}
			<CardTitle className=" px-6t m-4">
				<div className="flex h-max w-full justify-between">
					<div className="font-md text-xl tracking-wider text-secondary">Tracks</div>
					<Button className="bg-secondary text-button text-secondary-foreground" asChild variant="default" size="sm">
						<Link to="?new=true">
							<InlineIcon className="m-1 size-6" icon="akar-icons:plus" />
							New Track
						</Link>
					</Button>
				</div>
			</CardTitle>
			<CardContent>
				<DataTable
					highlightOnHover
					pointerOnHover
					striped
					onRowClicked={(track: TrackWithVersions) => {
						navigate(`${track.id}/edit`)
					}}
					columns={cols}
					data={tracks}
					theme="mixdown"
					customStyles={customStyles}
				/>
			</CardContent>
		</Card>
	)
}
