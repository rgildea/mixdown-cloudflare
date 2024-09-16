/* eslint-disable jsx-a11y/role-supports-aria-props */
import MixdownPlayer from '#app/components/MixdownPlayer'
import { TrackTile } from '#app/components/TrackTile'
import { usePlayerContext, usePlayerDispatchContext } from '#app/contexts/PlayerContext'
import { action } from '#app/root'
import { getUserImgSrc } from '#app/utils/misc'
import { getTrackWithVersionsByTrackId } from '#app/utils/track.server'
import { SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint } from '@conform-to/zod'
import { json, LoaderFunction } from '@remix-run/cloudflare'
import { Link, Outlet, useActionData, useFetcher, useLoaderData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { z } from 'zod'

export type TrackFormAction = 'set-active-version' | 'edit-title'

const schema = z.object({
	_action: z.literal('set-active-version'),
	activeTrackVersionId: z.string({ required_error: 'Track version is required' }),
})

export const loader = (async ({ params, context }) => {
	const trackId = params.id as string
	const notFoundResponse = new Response('Not found', { status: 404 })

	const track = await getTrackWithVersionsByTrackId(context.storageContext, trackId)

	if (!track) {
		console.error('No track found')
		throw notFoundResponse
	}

	return json({ track })
}) satisfies LoaderFunction

const TrackRoute: React.FC = () => {
	const { track } = useLoaderData<typeof loader>() // get the track from the loader data
	const versions = track.trackVersions
	const activeTrackVersionId = track.activeTrackVersion?.id
	const lastResult = useActionData<typeof action>() as SubmissionResult // get the last action result
	const playerDispatch = usePlayerDispatchContext() // get the player dispatch function
	const playerContext = usePlayerContext() // get the player context
	// get the version from the search params, or the active track version, or the first version
	const initialTrackVersionId = playerContext?.currentTrackVersionId || activeTrackVersionId || versions[0]?.id
	if (!initialTrackVersionId) {
		throw new Error('No track version found')
	}

	// Define a form to edit the track title and description
	const [form, fields] = useForm({
		lastResult,
		constraint: getZodConstraint(schema),
		// Validate field once user leaves the field
		shouldValidate: 'onBlur',
	})

	// make the title editable if there is an error
	const [isTitleEditable, setIsTitleEditable] = useState(lastResult?.error || form.errors ? true : false)

	// load the playlist into the player context
	useEffect(() => {
		playerDispatch({ type: 'SET_PLAYLIST', tracks: [track] })
		return () => {}
	}, [playerDispatch, track])

	useEffect(() => {
		if (initialTrackVersionId) {
			playerDispatch({ type: 'SET_SELECTED_TRACK_VERSION', track: track, versionId: initialTrackVersionId })
		}
	}, [initialTrackVersionId, playerDispatch, track])

	const fetcher = useFetcher()

	return (
		<>
			<div className="flex">
				<TrackTile className="grow-0" showPlaybutton={false} track={track} size="sm" />
				<div className="flex flex-grow flex-col justify-start">
					<fetcher.Form
						id="track-form"
						method="post"
						aria-invalid={form?.errors ? true : undefined}
						aria-describedby={form?.errors ? form.errorId : undefined}
					>
						<input type="hidden" name="_action" value="edit-title" />
						<div className="flex w-full flex-col">
							<span id={form.errorId} className="h-min text-xs font-normal tracking-wide text-destructive">
								{form.errors}
							</span>
							<div id="track-title" className="relative flex w-full flex-col">
								<input
									className={`right-0 top-0 border-b-2 bg-inherit text-xl font-normal caret-primary outline-none ${
										isTitleEditable ? 'border-primary' : 'border-transparent'
									}`}
									id={fields.title.id}
									type="text"
									name={fields.title.name}
									defaultValue={(fields.title.initialValue as string) ?? track.title}
									required
									aria-invalid={fields.title.errors ? true : undefined}
									aria-describedby={fields.title.errors ? fields.title.errorId : undefined}
									onFocus={() => setIsTitleEditable(true)}
									onBlur={e => {
										setIsTitleEditable(false)
										const currentValue = e.currentTarget.value
										if (currentValue !== track.title) {
											e.currentTarget.form?.submit()
										}
									}}
									onKeyDown={e => {
										if (e.key === 'Enter') {
											setIsTitleEditable(false)
											e.currentTarget.form?.submit()
										}
										if (e.key === 'Escape') {
											setIsTitleEditable(false)
											e.currentTarget.form?.reset()
											e.currentTarget.blur()
										}
									}}
								/>
								<span id={fields.title.errorId} className="min-h-4 text-xs font-normal tracking-wide text-destructive">
									{fields.title.errors}
								</span>
							</div>
						</div>
					</fetcher.Form>

					<div id="track-metadata" className="theme-light text-body-2xs font-light text-muted-foreground">
						<span>
							{versions.length} version{versions.length > 1 ? 's' : ''}
						</span>
						<span className="m-1">|</span>
						<span className="m-1">
							created by{' '}
							<Link
								to={`/users/${track.creator.username}`}
								onClick={e => e.preventDefault()}
								className="hover:font-group inline-flex place-items-start items-baseline"
							>
								{track.creator.image && typeof track.creator.image === 'object' && (
									<img
										className="m-1 mr-0.5 size-[0.75rem] translate-y-[2px] rounded-full object-cover opacity-50"
										alt={track.creator.username ?? 'anonymous user'}
										src={getUserImgSrc(track.creator.image.id)}
									/>
								)}

								<span className="">{`${track.creator.username ?? 'anonymous user'}`}</span>
							</Link>
						</span>
					</div>
				</div>
			</div>
			<MixdownPlayer key="player" embed={true} track={track} currentTrackVersionId={initialTrackVersionId} />
			<Outlet />
		</>
	)
}

export default TrackRoute
