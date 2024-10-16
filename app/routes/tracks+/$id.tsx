/* eslint-disable jsx-a11y/role-supports-aria-props */
import MixdownPlayer from '#app/components/MixdownPlayer'
import { TrackTile } from '#app/components/TrackTile'
import { usePlayerContext, usePlayerDispatchContext } from '#app/contexts/PlayerContext'
import { requireUserId } from '#app/utils/auth.server'
import { getUserImgSrc } from '#app/utils/misc'
import { getTrackWithVersionsByTrackId, updateTrack, updateTrackActiveVersion } from '#app/utils/track.server'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/cloudflare'
import { Link, Outlet, useActionData, useFetcher, useLoaderData } from '@remix-run/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
const notFoundResponse = new Response('Not found', { status: 404 })
export type TrackFormAction = 'set-active-version' | 'edit-title'
const EditTitleSchema = z.object({ intent: z.literal('edit-title'), title: z.string().min(5).max(80) })
const SetActiveVersionSchema = z.object({
	intent: z.literal('set-active-version'),
	activeTrackVersionId: z.string().uuid(),
})
export const ActionSchema = z.discriminatedUnion('intent', [EditTitleSchema, SetActiveVersionSchema])

export const action = async ({ request, params, context: { storageContext } }: ActionFunctionArgs) => {
	const userId = await requireUserId(storageContext, request)
	const formData = await request.formData()
	const trackId = params.id
	if (!trackId) {
		throw new Response('Invalid track id', { status: 400 })
	}
	const track = await getTrackWithVersionsByTrackId(storageContext, trackId)
	if (!track) {
		throw new Response('Not found', { status: 404 })
	}
	const intent = formData.get('intent') as TrackFormAction
	if (!intent) {
		throw new Response('Invalid intent', { status: 400 })
	}
	if (!userId || track.creator.id !== userId) {
		throw new Response('Unauthorized', { status: 401 })
	}

	const submission = await parseWithZod(formData, {
		schema: () =>
			ActionSchema.superRefine(async data => {
				if (data.intent === 'edit-title') {
					return parseWithZod(formData, { schema: EditTitleSchema, async: true })
				}
				if (data.intent === 'set-active-version') {
					return parseWithZod(formData, { schema: SetActiveVersionSchema, async: true })
				}
				throw new Error('Invalid intent')
			}),
		async: true,
	})

	if (submission.status !== 'success') {
		console.error('Submission failed', submission)
		console.error('Submission error', submission.error)
		return { result: submission.reply(), status: submission.status === 'error' ? 400 : 200 }
	}

	if (intent === 'edit-title') {
		const title = formData.get('title') as string
		if (!title) {
			return {
				result: submission.reply({ formErrors: ['Title is required, fool!'] }),
			}
		}

		try {
			const updated = await updateTrack(storageContext, trackId, title)
			if (!updated) {
				return { result: submission.reply({ formErrors: [`Failed to update track ${trackId}`] }) }
			}
		} catch (err) {
			console.error(err)
			return { result: submission.reply({ formErrors: [`Failed to update track ${trackId}`] }) }
		}

		return redirect(`/tracks/${trackId}/versions`)
	} else if (intent === 'set-active-version') {
		const activeTrackVersion = track.trackVersions.find(v => v.id === formData.get('activeTrackVersionId'))
		if (!activeTrackVersion) {
			return { result: submission.reply({ formErrors: [`Invalid track version`] }) }
		}

		try {
			const updated = await updateTrackActiveVersion(storageContext, trackId, activeTrackVersion.id)
			if (!updated) {
				return { result: submission.reply({ formErrors: [`Failed to update track ${trackId}`] }) }
			}
		} catch (err) {
			console.error(err)
			return { result: submission.reply({ formErrors: [`Failed to update track ${trackId}`] }) }
		}

		return redirect(`/tracks/${trackId}/versions`)
	}

	console.warn('Unknown action:', intent)
	return { result: submission.reply() }
}

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
	const trackId = params.id as string

	const track = await getTrackWithVersionsByTrackId(context.storageContext, trackId)

	if (!track) {
		console.error('No track found')
		throw notFoundResponse
	}

	return { track }
}

const TrackRoute: React.FC = () => {
	const { track } = useLoaderData<typeof loader>() // get the track from the loader data

	const versions = track.trackVersions
	const actionData = useActionData<typeof action>() // get the last action result
	const playerDispatch = usePlayerDispatchContext() // get the player dispatch function
	const playerContext = usePlayerContext() // get the player context
	// get the version from the player context, or track's active version, or the first version.
	const initialTrackVersionId =
		playerContext?.currentTrackVersionId || // use the selected track version from the player context
		track.activeTrackVersion?.id || // use the active track version from the track
		track.trackVersions[0]?.id // use the first track version and hope for the best
	if (!initialTrackVersionId) {
		throw new Error('No track version found')
	}

	// Define a form to edit the track title
	const [form, fields] = useForm({
		id: 'edit-track-form',
		defaultValue: {
			intent: 'edit-title',
			title: track?.title ?? '',
		},
		lastResult: actionData?.result,
		constraint: getZodConstraint(ActionSchema),
		shouldValidate: 'onBlur',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ActionSchema })
		},
	})

	// make the title editable if there is an error
	// const [isTitleEditable, setIsTitleEditable] = useState(lastResult?.error ? true : false || form.errors ? true : false)
	const [isTitleEditable, setIsTitleEditable] = useState(false)

	// load the playlist into the player context
	useEffect(() => {
		playerDispatch({ type: 'SET_PLAYLIST', tracks: [track] })
		return () => {}
	}, [playerDispatch, track])

	useEffect(() => {
		if (initialTrackVersionId) {
			playerDispatch({ type: 'SET_SELECTED_TRACK_VERSION', track, versionId: initialTrackVersionId })
		}
	}, [initialTrackVersionId, playerDispatch, track])

	const fetcher = useFetcher()
	const titleRef = useRef<HTMLInputElement>(null)

	const variants = {
		visible: { opacity: 1, transition: { duration: 0.2 } },
		hidden: { opacity: 0, transition: { duration: 0.4 } },
	}

	const resetForm = () => {
		setIsTitleEditable(false)
		form?.reset()
	}

	fields.title.errors?.forEach(error => {
		console.error('title error:', error)
	})

	return (
		<>
			<div className="flex">
				<TrackTile className="grow-0" showPlaybutton={false} track={track} size="sm" />
				<div className="flex flex-grow flex-col justify-start">
					<fetcher.Form {...getFormProps(form)} id={'edit-track-form'} method="post">
						<input {...getInputProps(fields.intent, { type: 'hidden' })} />
						<div className="flex flex-col">
							<span id={form.errorId} className="h-min text-xs font-normal tracking-wide text-destructive">
								{form.errors}
							</span>
							<div id="track-title" className="flex flex-col p-1 pb-0">
								<AnimatePresence mode="popLayout">
									<motion.div layout variants={variants} className="flex w-full" key="input-title">
										<div className="place-content-center">
											{/* Edit button */}
											<div className={`flex p-1 ${isTitleEditable ? 'hidden' : 'visible'}`}>
												<button
													className={`group`}
													onClick={e => {
														e.preventDefault()
														titleRef.current?.focus()
														setCursorToEnd(titleRef.current)
													}}
												>
													<InlineIcon
														className="size-5 transition-all ease-in-out group-hover:scale-[150%] group-hover:cursor-pointer"
														icon={'mdi-pencil-outline'}
													/>
												</button>
											</div>
											{/* Cancel and Submit buttons */}
											<div
												className={`flex shrink-0 items-stretch gap-2 px-2 transition-all ease-in-out ${isTitleEditable ? 'visible' : 'hidden'}`}
											>
												<button
													{...form.reset.getButtonProps()}
													onClick={() => {
														resetForm()
													}}
													className={`group text-secondary`}
												>
													<InlineIcon
														className="size-5 transition-all duration-100 ease-in-out group-hover:scale-[125%] group-hover:cursor-pointer"
														icon={'mdi:close'}
													/>
												</button>
												<button
													onClick={() => {
														setIsTitleEditable(false)
													}}
													id="submit"
													name="submit"
													type="submit"
													className={`group text-secondary`}
												>
													<InlineIcon
														className="size-5 h-full transition-all duration-100 ease-in-out group-hover:scale-[125%] group-hover:cursor-pointer"
														icon={'mdi:check'}
													/>
												</button>
											</div>
										</div>
										<div className="mx-auto flex w-full flex-col">
											<motion.input
												layout
												{...getInputProps(fields.title, { type: 'text' })}
												className={`w-full shrink-0 grow border-b-2 bg-inherit text-xl font-normal caret-primary outline-none ${isTitleEditable ? 'border-primary' : 'border-transparent'}`}
												ref={titleRef}
												onFocusCapture={() => {
													setIsTitleEditable(true)
												}}
												onKeyDown={e => {
													if (e.key === 'Enter') {
														e.preventDefault()
														e.currentTarget.blur()
														setIsTitleEditable(false)
														fetcher.submit(e.currentTarget.form, {
															method: 'POST',
														})
													}
													if (e.key === 'Escape') {
														e.currentTarget.blur()
														resetForm()
													}
												}}
											/>
											{fields.title.errors ? (
												<span
													id={fields.title.errorId}
													className="min-h-4 text-xs font-normal tracking-wide text-destructive"
												>
													{fields.title.errors}
												</span>
											) : null}
										</div>
									</motion.div>
								</AnimatePresence>
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

const setCursorToEnd = (inputElement: HTMLInputElement | null) => {
	if (!inputElement) return
	const range = document.createRange()
	const selection = window.getSelection()
	const textNode = inputElement.childNodes[0]
	if (!textNode) return
	const textLength = textNode.textContent?.length ?? 0
	range.setStart(textNode, textLength)
	range.setEnd(textNode, textLength)
	selection?.removeAllRanges()
	selection?.addRange(range)
}

export default TrackRoute
