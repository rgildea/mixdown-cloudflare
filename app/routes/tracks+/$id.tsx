/* eslint-disable jsx-a11y/role-supports-aria-props */
import MixdownPlayer from '#app/components/MixdownPlayer'
import { TrackTile } from '#app/components/TrackTile'
import { Button } from '#app/components/ui/button'
import { usePlayerDispatchContext } from '#app/contexts/PlayerContext'
import { requireUserId } from '#app/utils/auth.server'
import { getUserImgSrc } from '#app/utils/misc'
import { getTrackWithVersionsByTrackId, updateTrack, updateTrackActiveVersion } from '#app/utils/track.server'
import { SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { ActionFunctionArgs, json, LoaderFunction, redirect } from '@remix-run/cloudflare'
import { Link, useActionData, useFetcher, useLoaderData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { z } from 'zod'

export type TrackFormAction = 'set-active-version' | 'edit-title'

const schemas = {
	'edit-title': z.object({
		_action: z.literal('edit-title'),
		title: z.string({ required_error: 'Title is required' }).max(80, 'Title is too long'),
	}),
	'set-active-version': z.object({
		_action: z.literal('set-active-version'),
		activeTrackVersionId: z.string({ required_error: 'Track version is required' }),
	}),
}

export const action = async ({ request, params, context: { storageContext } }: ActionFunctionArgs) => {
	const trackId = params.id
	if (!trackId) {
		throw new Response('Invalid track id', { status: 400 })
	}

	const track = await getTrackWithVersionsByTrackId(storageContext, trackId)
	if (!track) {
		throw new Response('Not found', { status: 404 })
	}

	const formData = await request.formData()
	const _action = formData.get('_action') as TrackFormAction
	if (!_action) {
		throw new Response('Invalid action', { status: 400 })
	}

	const userId = await requireUserId(storageContext, request)
	if (!userId || track.creator.id !== userId) {
		throw new Response('Unauthorized', { status: 401 })
	}

	const schema = getSchema(_action)
	const submission = parseWithZod(formData, { schema })
	// Report the submission to client if it is not successful
	if (submission.status !== 'success') {
		return submission.reply()
	}

	if (_action === 'set-active-version') {
		const activeTrackVersion = track.trackVersions.find(v => v.id === formData.get('activeTrackVersionId'))
		if (!activeTrackVersion) {
			return submission.reply({ formErrors: [`Invalid track version`] })
		}

		try {
			const updated = await updateTrackActiveVersion(storageContext, trackId, activeTrackVersion.id)
			if (!updated) {
				return submission.reply({ formErrors: [`Failed to update track ${trackId}`] })
			}
		} catch (err) {
			console.error(err)
			return submission.reply({ formErrors: [`Failed to update track ${trackId}`] })
		}

		// return new Response('OK', { status: 200 })
		return redirect(`/tracks/${trackId}`)
	}

	if (_action === 'edit-title') {
		const trackId = track.id
		if (!trackId) {
			throw new Response('Not found', { status: 404 })
		}

		if (!track) {
			throw new Response('Not found', { status: 404 })
		}

		const { title } = submission.value
		track.title = title

		try {
			const updated = await updateTrack(storageContext, trackId, title)
			if (!updated) {
				return submission.reply({ formErrors: [`Failed to update track ${trackId}`] })
			}
		} catch (err) {
			console.error(err)
			return submission.reply({ formErrors: [`Failed to update track ${trackId}`] })
		}
	}

	return submission.reply()
}

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
	const [selectedTrackVersionId, setSelectedVersionId] = useState(null as unknown as string)
	const playerDispatch = usePlayerDispatchContext() // get the player dispatch function

	// get the version from the search params, or the active track version, or the first version
	const initialTrackVersionId = selectedTrackVersionId || activeTrackVersionId || versions[0]?.id
	if (!initialTrackVersionId) {
		throw new Error('No track version found')
	}

	// Define a form to edit the track title and description
	const [form, fields] = useForm({
		lastResult,
		constraint: getZodConstraint(schemas['edit-title']),
		// Validate field once user leaves the field
		shouldValidate: 'onBlur',
	})

	// make the title editable if there is an error
	const [isTitleEditable, setIsTitleEditable] = useState(lastResult?.error || form.errors ? true : false)

	// // set the title and icon for the page
	// useEffect(() => {
	// 	titleDispatch({ type: 'SET_TITLE', title: 'Mixdown!', icon: 'mdi:home' })
	// 	return () => {}
	// })

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
	const optimisticActiveTrackVersionId = fetcher.formData?.get('activeTrackVersionId') || activeTrackVersionId
	const versionItems = track.trackVersions.map(v => {
		const isActive = v.id === optimisticActiveTrackVersionId
		const icon = `mdi:star${isActive ? '' : '-outline'}`
		return (
			<div className="flex flex-row items-center gap-2" key={v.id}>
				<fetcher.Form
					onSubmit={() => {
						console.log('Updating selected version while setting active: ', v.id)
						setSelectedVersionId(v.id)
					}}
					id={form.id}
					method="post"
				>
					<input type="hidden" name="_action" value="set-active-version" />
					<input type="hidden" name="trackId" value={track.id} />
					<input type="hidden" name="activeTrackVersionId" value={v.id} />
					<Button variant="playbutton-destructive" className="group text-secondary" type="submit">
						<InlineIcon
							className="duration-250 size-4 transition-all ease-in-out group-hover:scale-[150%] group-hover:cursor-pointer"
							icon={icon}
						/>
					</Button>
				</fetcher.Form>
				<button
					className={`group-hover:bg-gray-300/60' mx-auto flex w-full flex-grow items-center gap-2 rounded-sm py-3 text-body-xs hover:cursor-pointer hover:bg-gray-300/60 hover:text-foreground ${initialTrackVersionId === v.id ? 'text-foreground' : 'text-muted-foreground'}`}
					type="submit"
					key={v.id}
					onClick={() => {
						console.log('Updating selected Version ', v.id)
						setSelectedVersionId(v.id)
					}}
				>
					<span className="ml-2 hover:cursor-pointer">{v.title}</span>
				</button>
			</div>
		)
	})

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
			<MixdownPlayer key="player" embed={true} track={track} currentTrackVersionId={selectedTrackVersionId} />
			<div className="flex flex-col">{versionItems}</div>
		</>
	)
}

export default TrackRoute

function getSchema(_action: string): any {
	return schemas[_action as keyof typeof schemas]
}
