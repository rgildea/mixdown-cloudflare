/* eslint-disable jsx-a11y/role-supports-aria-props */
import MixdownPlayer from '#app/components/MixdownPlayer'
import { TrackTile } from '#app/components/TrackTile'
import { CardContent } from '#app/components/ui/card'
import RadioButton from '#app/components/ui/radio-button'
import { PlayerDispatchContext } from '#app/contexts/PlayerContext'
import { TitleDispatchContext } from '#app/contexts/TitleContext'
import { requireUserId } from '#app/utils/auth.server'
import { cn, getUserImgSrc } from '#app/utils/misc'
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

	try {
		const updated = await updateTrack(storageContext, trackId, title, description, userId)
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

	const track = await context.storageContext.db.track.findUnique({
		where: {
			id: trackId,
		},
		include: {
			trackVersions: {
				orderBy: {
					created_at: 'desc',
				},
			},
			creator: true,
			activeTrackVersion: true,
		},
	})
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

	console.log('Last Result:', lastResult)
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

	const creator: { id: string; username: string; image?: boolean | { id: string } | undefined } = track.creator
	const versions = track.trackVersions || []
	const activeVersion = track?.activeTrackVersion
	const [selectedVersionId, setSelectedVersionId] = useState(activeVersion?.id)
	const versionItems = versions.map(v => (
		<RadioButton
			group="activeTrackVersionId"
			key={v.id}
			id={v.id}
			title={v.title}
			checked={selectedVersionId === v.id}
			onChange={() => {
				console.log('onChange', v.id)
				setSelectedVersionId(v.id)
			}}
		/>
	))

	const [isTitleEditable, setIsTitleEditable] = useState(false)
	// const [isDescriptionEditable, setIsDescriptionEditable] = useState(false)
	const formRef = useRef<HTMLFormElement>(null)
	return (
		<>
			<div className={cn('flex', '')}>
				<TrackTile showPlaybutton={false} track={track} size="sm" />
				<form
					id="track-form"
					ref={formRef}
					method="post"
					aria-invalid={form?.errors ? true : undefined}
					aria-describedby={form?.errors ? form.errorId : undefined}
				>
					<div className="mb-4 flex w-full flex-col justify-between">
						<div>
							<span id={form.errorId} className="h-min text-xs font-normal tracking-wide text-destructive">
								{form.errors}
							</span>
							<div id="track-title" className="relative flex w-full flex-col">
								<input
									id={fields.title.id}
									type="text"
									name={fields.title.name}
									defaultValue={(fields.title.initialValue as string) ?? track.title}
									required
									aria-invalid={fields.title.errors ? true : undefined}
									aria-describedby={fields.title.errors ? fields.title.errorId : undefined}
									className={`right-0 top-0  border-b-2 bg-inherit text-2xl font-normal caret-primary outline-none ${
										isTitleEditable ? 'border-primary' : 'border-transparent'
									}`}
									onBlur={e => {
										console.log('blur')
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
											console.log('enter')
											setIsTitleEditable(false)
											formRef.current?.submit()
										}
										if (e.key === 'Escape') {
											console.log('escape')
											setIsTitleEditable(false)
											formRef.current?.reset()
											e.currentTarget.blur()
										}
									}} // this is for progressive enhancement
								/>
								<span id={fields.title.errorId} className="min-h-4 text-xs font-normal tracking-wide text-destructive">
									{fields.title.errors}
								</span>
							</div>

							{/* <div id="track-description" className="relative flex w-full flex-col">
								<input
									id="track-description"
									type="text"
									name="description"
									className={`right-0 top-0 border-b-2 bg-inherit text-base font-normal caret-primary outline-none ${
										isDescriptionEditable ? 'border-primary' : 'border-transparent'
									}`}
									aria-invalid={fields.description.errors ? true : undefined}
									aria-describedby={fields.description.errors ? fields.description.errorId : undefined}
									defaultValue={(fields.description.initialValue as string) ?? track.description}
									onBlur={e => {
										console.log('blur')
										setIsDescriptionEditable(false)
										const currentValue = e.currentTarget.value
										if (currentValue !== fields.description.initialValue) {
											console.log('submitting')
											formRef.current?.submit()
										} else {
											console.log('not submitting')
										}
									}}
									onFocus={() => setIsDescriptionEditable(true)}
									onKeyDown={e => {
										if (e.key === 'Enter') {
											console.log('enter')
											setIsDescriptionEditable(false)
											formRef.current?.submit()
										}
										if (e.key === 'Escape') {
											console.log('escape')
											setIsDescriptionEditable(false)
											formRef.current?.reset()
											e.currentTarget.blur()
										}
									}} // this is for progressive enhancement
								/>
								<span
									id={fields.description.errorId}
									className="min-h-4 text-xs font-normal tracking-wide text-destructive"
								>
									{fields.description.errors}
								</span>
							</div> */}
						</div>

						<div id="track-metadata" className="theme-light text-body-2xs font-light text-muted-foreground">
							<span>
								{versions.length} version{track?.trackVersions.length > 1 ? 's' : ''}
							</span>
							<span className="m-1">|</span>
							<span className="m-1">
								created by{' '}
								<Link
									to={`/users/${track.creator.username}`}
									// this is for progressive enhancement
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
					</div>
				</form>
			</div>
			<CardContent className="px-0">
				<MixdownPlayer
					track={track}
					trackVersion={track.trackVersions.find(version => version.id === selectedVersionId)}
					key="player"
					embed={true}
				/>
				<Form method="post" className="flex flex-col gap-2">
					<div className="font-medium leading-none">{versionItems}</div>
				</Form>
			</CardContent>
		</>
	)
}
