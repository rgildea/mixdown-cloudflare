import { Button } from '#app/components/ui/button'
import { usePlayerContext, usePlayerDispatchContext } from '#app/contexts/PlayerContext'
import { ActionSchema, loader as trackIndexLoader } from '#app/routes/tracks+/$id'
import { userOwnsTrack } from '#app/utils/user'
import { SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint } from '@conform-to/zod'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { Link, NavLink, useFetcher, useMatches, useRouteLoaderData } from '@remix-run/react'
import { useEffect } from 'react'

const TRACK_ROUTE_ID = 'routes/tracks+/$id'
const TrackVersionsRoute = () => {
	const matches = useMatches()

	const matchedRouteForTrack = matches.find(match => match.id === TRACK_ROUTE_ID)
	const trackData = useRouteLoaderData<typeof trackIndexLoader>(TRACK_ROUTE_ID)
	const track = trackData?.track
	const versions = track?.trackVersions
	const activeTrackVersionId = track?.activeTrackVersion?.id
	const lastResult = matchedRouteForTrack?.data as SubmissionResult
	const playerContext = usePlayerContext()
	const playerDispatch = usePlayerDispatchContext()

	// get the version from the search params, or the active track version, or the first version
	const initialTrackVersionId = playerContext?.currentTrackVersionId || activeTrackVersionId || versions?.[0]?.id
	if (!initialTrackVersionId) {
		throw new Error('No track version found')
	}

	// Define a form to edit the track title and description
	const [form] = useForm({
		id: 'set-active-version',
		lastResult,
		constraint: getZodConstraint(ActionSchema),
		// Validate field once user leaves the field
		shouldValidate: 'onBlur',
	})

	useEffect(() => {
		if (initialTrackVersionId) {
			playerDispatch({ type: 'SET_SELECTED_TRACK_VERSION', track, versionId: initialTrackVersionId })
		}
	}, [initialTrackVersionId, playerDispatch, track])

	const fetcher = useFetcher()
	const optimisticActiveTrackVersionId = fetcher.formData?.get('activeTrackVersionId') || activeTrackVersionId
	const versionItems = track?.trackVersions.map(v => {
		const isActive = v.id === optimisticActiveTrackVersionId
		const icon = `mdi:star${isActive ? '' : '-outline'}`
		return (
			<div
				className={`group mx-auto flex w-full flex-nowrap gap-2 rounded-sm py-1 text-body-xs hover:cursor-pointer hover:bg-gray-300/60 hover:text-foreground ${initialTrackVersionId === v.id ? 'text-foreground' : 'text-muted-foreground'}`}
				key={v.id}
			>
				<div className="flex grow-0 items-center">
					<fetcher.Form
						onSubmit={() => {
							console.debug('Updating selected version while setting active: ', v.id)
							playerDispatch({ type: 'SET_SELECTED_TRACK_VERSION', track: track, versionId: v.id })
						}}
						id={form.id}
						method="post"
						action={`/tracks/${track?.id}`}
					>
						<input type="hidden" name="intent" value="set-active-version" />
						<input type="hidden" name="activeTrackVersionId" value={v.id} />
						<Button variant="playbutton-destructive" className="group text-secondary" type="submit">
							<InlineIcon
								className="duration-250 size-4 transition-all ease-in-out group-hover:scale-[150%] group-hover:cursor-pointer"
								icon={icon}
							/>
						</Button>
					</fetcher.Form>
				</div>

				<div className="grow-1 flex w-full items-stretch">
					<button
						onClick={() => {
							playerDispatch({ type: 'SET_SELECTED_TRACK_VERSION', track, versionId: v.id })
						}}
					>
						{v.title}
					</button>
				</div>

				<div className="nowrap flex grow-0 items-center">
					{userOwnsTrack(track.creator, track) && (
						<>
							<div>
								<Button className="invisible group-hover:visible" variant="playbutton" size={'trackrow'} asChild>
									<NavLink to={v.id}>
										<InlineIcon className="size-6 sm:size-4" icon="mdi:pencil" />
									</NavLink>
								</Button>
							</div>

							<>
								<fetcher.Form method="post" action={v.id} className="group">
									<input type="hidden" name="intent" value="delete" />
									<Button
										className="invisible ml-auto p-1 text-button focus-visible:ring-0 group-hover:visible"
										type="submit"
										variant="playbutton-destructive"
										onSubmit={e => {
											e.preventDefault()
											if (confirm('Are you sure you want to delete this track version?')) {
												e.currentTarget?.form?.submit()
											}
										}}
									>
										<InlineIcon className="invisible size-6 group-hover:visible sm:size-4" icon="mdi:delete" />
									</Button>
								</fetcher.Form>
							</>
						</>
					)}
				</div>
			</div>
		)
	})

	return (
		<div className="mt-2 flex flex-col gap-2">
			<Button className="ml-4 w-min text-nowrap" variant="default" asChild>
				<div>
					<Link className="flex items-center font-sans text-body-xs font-medium" to="?new=true">
						<InlineIcon className="size-6" icon="mdi:plus" />
						<span className="hover:cursor-pointer">New Version</span>
					</Link>
				</div>
			</Button>
			<div>{versionItems}</div>
		</div>
	)
}

export default TrackVersionsRoute
