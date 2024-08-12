import PlayButton from '#app/components/PlayButton'
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '#app/components/ui/card'
import RadioButton from '#app/components/ui/radio-button'
import { TitleDispatchContext } from '#app/contexts/TitleContext'
import { requireUserId } from '#app/utils/auth.server'
import { getUserImgSrc } from '#app/utils/misc'
import { TrackWithVersions, getTrackWithVersionsByTrackId, updateTrack } from '#app/utils/track.server'
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/cloudflare'
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react'
import { useContext, useEffect, useRef, useState } from 'react'
import { z } from 'zod'

// Define a schema to validate the form input
const schema = z.object({
	// The preprocess step is required for zod to perform the required check properly
	// as the value of an empty input is usually an empty string
	title: z.preprocess(
		value => (value === '' ? undefined : value),
		z.string({ required_error: 'Title is required' }).max(80, 'Title is too long'),
	),
	description: z.preprocess(
		value => (value === '' ? undefined : value),
		z.string().max(255, 'Description must be less than 255 characters').optional(),
	),
})

export const action = async ({ request, params, context: { storageContext } }: ActionFunctionArgs) => {
	const formData = await request.formData()
	console.log('formData', formData)
	const payload = Object.fromEntries(formData)
	const result = schema.safeParse(payload)

	// Report the submission to client if it is not successful
	if (!result.success) {
		console.log('result.error', result.error)
		const error = result.error.flatten()
		return {
			payload,
			formErrors: error.formErrors,
			fieldErrors: error.fieldErrors,
		}
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

	const { title, description } = result.data

	try {
		const updated = await updateTrack(storageContext, trackId, title, description, userId)
		if (!updated) {
			throw new Error(`Failed to update track ${trackId}`)
		}
	} catch (err) {
		console.error(err)
		throw new Error(`Failed to update track ${trackId}`)
	}

	return redirect(`/tracks/${track.id}`)
}

export async function loader({ params, context }: LoaderFunctionArgs) {
	const notFoundResponse = new Response('Not found', { status: 404 })
	const trackId = params.id as string
	console.info(params)
	console.info('Found trackId in loader', trackId)

	if (!trackId) {
		console.warn('No trackId')
		return notFoundResponse
	}
	console.info('querying for track')
	const track: TrackWithVersions = await getTrackWithVersionsByTrackId(context.storageContext, trackId)

	if (!track) {
		console.warn('No track found')
		return notFoundResponse
	}

	return { track }
}

export default function TrackRoute() {
	const { track } = useLoaderData<typeof loader>() as { track: TrackWithVersions }
	const titleDispatch = useContext(TitleDispatchContext)
	const lastResult = useActionData<typeof action>()

	// set the title and icon for the page
	useEffect(() => {
		titleDispatch({ type: 'SET_TITLE', title: 'Mixdown!', icon: 'mdi:home' })
		return () => {}
	})

	useEffect(() => {
		if (lastResult?.formErrors || lastResult?.fieldErrors) {
			console.log('lastResult', lastResult)
			for (const key in lastResult.fieldErrors) {
				console.log('formErrors', key, lastResult.fieldErrors)
			}
			setIsTitleEditable(true)
			setIsDescriptionEditable(true)
		}
	}, [lastResult])

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
	const [isDescriptionEditable, setIsDescriptionEditable] = useState(false)
	const formRef = useRef<HTMLFormElement>(null)
	const title = (lastResult?.payload.title ?? track.title ?? '') as string
	const description = (lastResult?.payload.description ?? track.description ?? '') as string
	return (
		<>
			<Card className="flex flex-col p-3 sm:w-3/4">
				<CardTitle>
					<div className="flex">
						<div className=" m-1 mb-4 mr-4 grid size-24 shrink-0 grow-0 items-center rounded-sm bg-gray-300">
							<PlayButton className="" size="md" track={track} />
						</div>

						<div id="titleEdit" className="w-full items-center self-center text-xs">
							<form ref={formRef} method="post" aria-describedby={lastResult?.formErrors ? 'track-error' : undefined}>
								<div className="flex flex-col gap-0">
									<div id="track-error">{lastResult?.formErrors}</div>
									<div className="relative flex w-full flex-col">
										<input
											id="track-title"
											type="text"
											name="title"
											className={`right-0 top-0  border-b-2 bg-inherit text-2xl font-normal caret-primary outline-none ${
												isTitleEditable ? 'border-primary' : 'border-transparent'
											}`}
											aria-invalid={lastResult?.fieldErrors.title ? true : undefined}
											aria-describedby={lastResult?.fieldErrors.title ? 'track-title-error' : undefined}
											defaultValue={title}
											required
											onBlur={e => {
												console.log('blur')
												setIsTitleEditable(false)
												const currentValue = e.currentTarget.value
												if (currentValue !== title) {
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
										<div id="track-title-error" className="font-normal tracking-wide text-destructive">
											{lastResult?.fieldErrors.title}
										</div>
									</div>

									<div className="relative flex flex-col">
										<input
											type="text"
											name="description"
											className={`flex-nowrap border-b-2 bg-inherit text-body-xs font-normal leading-snug caret-primary outline-none ${
												isDescriptionEditable ? 'border-primary' : 'border-transparent'
											}`}
											defaultValue={description}
											onBlur={() => {
												console.log('blur')
												setIsDescriptionEditable(false)
												formRef.current?.submit()
											}}
											onFocus={() => setIsDescriptionEditable(true)}
											onKeyDown={e => {
												if (e.key === 'Enter') {
													console.log('enter')
													setIsTitleEditable(false)
													formRef.current?.submit()
												}
											}} // this is for progressive enhancement
										/>
										<span className="font-normal tracking-wide text-destructive">
											{lastResult?.fieldErrors.description} {'\u00A0'}
										</span>
									</div>
								</div>
							</form>
							<CardDescription className="text-body-xs font-light">
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
										className="group inline-flex place-items-start items-baseline hover:font-extrabold"
									>
										{creator.image && typeof creator.image === 'object' && (
											<img
												className="m-1 mr-0.5 size-[0.75rem] translate-y-[2px] rounded-full object-cover opacity-50"
												alt={creator.username ?? 'anonymous user'}
												src={getUserImgSrc(creator.image.id)}
											/>
										)}

										<span className="group-hover:font-extrabold group-hover:leading-snug">
											{`${creator.username ?? 'anonymous user'}`}
										</span>
									</Link>
								</span>
							</CardDescription>
						</div>
					</div>
				</CardTitle>
				<CardContent className="px-2">
					<Form method="post" className="flex flex-col gap-2">
						<div className="font-medium leading-none">{versionItems}</div>
					</Form>
				</CardContent>
				<CardFooter></CardFooter>
			</Card>
		</>
	)
}
