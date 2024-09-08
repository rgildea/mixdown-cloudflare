/* eslint-disable jsx-a11y/role-supports-aria-props */
import MixdownPlayer from '#app/components/MixdownPlayer'
import { TrackTile } from '#app/components/TrackTile'
import TrackVersionButton from '#app/components/TrackVersionButton'
import { PlayerDispatchContext } from '#app/contexts/PlayerContext'
import { TitleDispatchContext } from '#app/contexts/TitleContext'
import { requireUserId } from '#app/utils/auth.server'
import { getUserImgSrc } from '#app/utils/misc'
import { getTrackWithVersionsByTrackId, updateTrack } from '#app/utils/track.server'
import { useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { ActionFunction, ActionFunctionArgs, json, LoaderFunction, redirect } from '@remix-run/cloudflare'
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react'
import { useContext, useEffect, useRef, useState } from 'react'
import invariant from 'tiny-invariant'
import { z } from 'zod'

// Define a schema to validate the form input
const schema = z.object({
	title: z.string({ required_error: 'Title is required' }).max(80, 'Title is too long'),
	description: z.string().max(255, 'Description must be less than 255 characters').optional(),
})

export const action = (async ({ request, params, context: { storageContext } }: ActionFunctionArgs) => {
	const formData = await request.formData()
	console.log('formData:', formData)
	const submission = parseWithZod(formData, { schema })

	// Report the submission to client if it is not successful
	if (submission.status !== 'success') {
		return submission.reply()
	}

	const trackId = params.id
	if (!trackId) {
		throw new Response('Not found', { status: 404 })
	}

	const track = await getTrackWithVersionsByTrackId(storageContext, trackId)
	if (!track) {
		throw new Response('Not found', { status: 404 })
	}

	const userId = await requireUserId(storageContext, request)

	if (!userId || track.creator.id !== userId) {
		throw new Response('Unauthorized', { status: 401 })
	}

	const { title, description } = submission.value
	track.title = title
	track.description = description ?? track.description

	try {
		const updated = await updateTrack(
			storageContext,
			trackId,
			title,
			track?.activeTrackVersion ?? undefined,
			description,
		)
		if (!updated) {
			return submission.reply({ formErrors: [`Failed to update track ${trackId}`] })
		}
	} catch (err) {
		console.error(err)
		return submission.reply({ formErrors: [`Failed to update track ${trackId}`] })
	}

	return redirect(`/tracks/${track.id}`)
}) satisfies ActionFunction

export const loader = (async ({ params, context }) => {
	invariant(params.id, 'No trackId')
	const trackId = params.id as string
	const notFoundResponse = new Response('Not found', { status: 404 })

	const track = await getTrackWithVersionsByTrackId(context.storageContext, trackId)

	if (!track) {
		console.error('No track found')
		throw notFoundResponse
	}

	return json({ track })
}) satisfies LoaderFunction

export default function TrackRoute() {
	const { track } = useLoaderData<typeof loader>() // get the track from the loader data
	const titleDispatch = useContext(TitleDispatchContext)
	const lastResult = useActionData<typeof action>()
	const playerDispatch = useContext(PlayerDispatchContext)

	console.info('Last Result:', lastResult)
	const [form, fields] = useForm({
		lastResult,
		constraint: getZodConstraint(schema),
	})
	// console.log('Form:', form)
	console.log('Fields:', fields)

	// set the title and icon for the page
	useEffect(() => {
		titleDispatch({ type: 'SET_TITLE', title: 'Mixdown!', icon: 'mdi:home' })
		return () => {}
	})

	useEffect(() => {
		if (lastResult?.error || form.errors) {
			setIsTitleEditable(true)
			// setIsDescriptionEditable(true)
		}
	}, [form.errors, lastResult])

	// load the playlist into the player context
	useEffect(() => {
		playerDispatch({ type: 'SET_PLAYLIST', tracks: [track] })
		return () => {}
	}, [playerDispatch, track])

	const creator = track.creator
	const versions = track.trackVersions || []
	const activeVersion = track?.activeTrackVersion
	const [selectedVersionId, setSelectedVersionId] = useState(activeVersion?.id)
	const versionItems = versions.map(v => {
		const isActiveVersion = () => {
			console.log('isActiveVersion', track.activeTrackVersion?.id, v.id)
			return track.activeTrackVersion?.id === v.id
		}

		return (
			<TrackVersionButton
				className={`flex-grow text-body-xs hover:text-foreground ${selectedVersionId === v.id ? 'text-foreground' : 'text-muted-foreground'}`}
				group="activeTrackVersionId"
				key={v.id}
				id={v.id}
				title={v.title}
				checked={isActiveVersion()}
				onChangeSelectedTrackVersion={() => {
					console.log('onChangeSelected', v.id)
					setSelectedVersionId(v.id)
				}}
				onChangeActiveTrackVersion={trackVersionId => {
					console.log('onChangeActive', track.id, trackVersionId)

					formRef.current?.submit()
				}}
			/>
		)
	})

	const [isTitleEditable, setIsTitleEditable] = useState(false)
	const formRef = useRef<HTMLFormElement>(null)
	return (
		<>
			<div className="flex justify-start">
				<TrackTile className="grow-0" showPlaybutton={false} track={track} size="sm" />
				<form
					id="track-form"
					ref={formRef}
					method="post"
					aria-invalid={form?.errors ? true : undefined}
					aria-describedby={form?.errors ? form.errorId : undefined}
					className="flex flex-grow flex-col justify-start"
				>
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
								onBlur={e => {
									setIsTitleEditable(false)
									const currentValue = e.currentTarget.value
									if (currentValue !== fields.title.initialValue) {
										console.log('submitting')
										formRef.current?.submit()
									} else {
										console.log('not submitting')
									}
								}}
								onFocus={() => setIsTitleEditable(true)}
								onKeyDown={e => {
									if (e.key === 'Enter') {
										setIsTitleEditable(false)
										formRef.current?.submit()
									}
									if (e.key === 'Escape') {
										setIsTitleEditable(false)
										formRef.current?.reset()
										e.currentTarget.blur()
									}
								}}
							/>
							<span id={fields.title.errorId} className="min-h-4 text-xs font-normal tracking-wide text-destructive">
								{fields.title.errors}
							</span>
						</div>
					</div>

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
								{creator.image && typeof creator.image === 'object' && (
									<img
										className="m-1 mr-0.5 size-[0.75rem] translate-y-[2px] rounded-full object-cover opacity-50"
										alt={creator.username ?? 'anonymous user'}
										src={getUserImgSrc(creator.image.id)}
									/>
								)}

								<span className="">{`${creator.username ?? 'anonymous user'}`}</span>
							</Link>
						</span>
					</div>
				</form>
			</div>
			<MixdownPlayer
				track={track}
				trackVersion={track.trackVersions.find(version => version.id === selectedVersionId)}
				key="player"
				embed={true}
			/>
			<Form method="post" className="flex flex-col">
				{versionItems}
			</Form>
		</>
	)
}
