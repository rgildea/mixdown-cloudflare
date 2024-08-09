import { TrackSchema } from '#app/components/EditTrackForm'
import EditTrackModal from '#app/components/EditTrackModal'
import PlayButton from '#app/components/PlayButton'
import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '#app/components/ui/card'
import { TitleDispatchContext } from '#app/contexts/TitleContext'
import { requireUserId } from '#app/utils/auth.server'
import { TrackWithVersions, getTrackWithVersionsByTrackId, updateTrack } from '#app/utils/track.server'
import { parseWithZod } from '@conform-to/zod'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/cloudflare'
import { useLoaderData, useNavigate, useSearchParams } from '@remix-run/react'
import { useContext, useEffect, useRef, useState } from 'react'

export const action = async ({ request, params, context: { storageContext } }: ActionFunctionArgs) => {
	const userId = await requireUserId(storageContext, request)
	const trackId = params.id as string
	const formData = await request.formData()
	const submission = await parseWithZod(formData, {
		schema: TrackSchema,
		async: true,
	})

	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
	}

	const { title, description } = submission.value

	try {
		const track = await updateTrack(storageContext, trackId, title, description, userId)
		if (track) {
			return redirect(`/tracks/${track.id}`)
		} else {
			throw new Error(`Failed to update track ${trackId}`)
		}
	} catch (err) {
		console.error(err)
		throw new Error(`Failed to update track ${trackId}`)
	}
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
	console.info(track ? 'Found track' : 'Track not found')
	if (!track) {
		console.warn('No track found')
		return notFoundResponse
	}

	return { track }
}
export default function TrackRoute() {
	const { track } = useLoaderData<typeof loader>() as { track: TrackWithVersions }
	const [searchParams] = useSearchParams()
	const isEditing = searchParams.get('edit') !== null
	const [isModalOpen, setModalOpen] = useState(isEditing)
	const [titleEditable, setTitleEditable] = useState(false)
	const titleRef = useRef<HTMLDivElement>(null)
	const navigate = useNavigate()
	const titleDispatch = useContext(TitleDispatchContext)
	const [trackTitle, setTrackTitle] = useState(track.title)
	// set the title and icon for the page
	useEffect(() => {
		titleDispatch({ type: 'SET_TITLE', title: 'Mixdown!', icon: 'mdi:home' })
		return () => {}
	})

	useEffect(() => {
		if (titleEditable) {
			console.log('focusing on titleEdit')
			const titleElement = titleRef.current
			if (titleElement) {
				const range = document.createRange()
				const selection = window.getSelection()
				const textNode = titleElement.childNodes[0]
				const textLength = textNode ? textNode.textContent?.length ?? 0 : 0
				range.setStart(textNode, textLength)
				range.setEnd(textNode, textLength)
				selection?.removeAllRanges()
				selection?.addRange(range)
				console.log('adding selection to titleEdit', selection)
				titleElement.focus()
			}
		}
	}, [titleEditable])

	const handleDismiss = () => {
		navigate('..', { replace: true, unstable_flushSync: true })
	}

	const versions = track.trackVersions || []
	const activeVersion = track?.activeTrackVersion
	const versionItems = versions.map(v => (
		<div
			key={v.id}
			className="justify-left flex items-center rounded-sm p-1 py-2 odd:bg-gray-200 hover:cursor-pointer hover:bg-gray-300/60"
		>
			<InlineIcon className="size-4" icon={`mdi:star${activeVersion && activeVersion.id !== v.id ? '-outline' : ''}`} />
			<div className="ml-2">{v.title}</div>
		</div>
	))

	const toggleEdit = () => {
		setTitleEditable(!titleEditable)
	}

	const handleTitleEditButtonClick = () => {
		if (titleEditable) {
			const titleElement = titleRef.current
			if (titleElement) {
				const title = titleElement.textContent
				if (title) {
					setTrackTitle(title)
				}
			}
			toggleEdit()
		} else {
			cancel()
		}
	}

	const cancel = () => {
		console.log('cancelling')
		const titleElement = titleRef.current
		if (titleElement) {
			titleElement.textContent = trackTitle
		}
		toggleEdit()
	}

	return (
		<>
			<EditTrackModal track={track} isModalOpen={isModalOpen} setIsModalOpen={setModalOpen} onDismiss={handleDismiss} />
			<Card className="flex flex-col p-3 sm:w-3/4">
				<CardTitle>
					<div className="flex">
						<div className={`m-1 mb-4 mr-4 grid size-24 grow-0 place-items-center rounded-sm bg-gray-300`}>
							<PlayButton className="" size="md" track={track} />
						</div>
						<div id="titleEdit" className="grow-1 group flex-col place-items-center self-center text-xs font-light">
							<div className="flex">
								<div
									ref={titleRef}
									contentEditable={titleEditable}
									defaultValue={`${trackTitle}`}
									suppressContentEditableWarning={true}
									onBlur={() => {
										setTitleEditable(false)
									}}
									className={`flex-nowrap border-b-2 bg-inherit text-2xl font-normal caret-primary outline-none ${titleEditable ? 'border-primary' : 'border-transparent'}`}
								>
									{track.title}
								</div>
								<Button
									className={`${titleEditable ? '' : 'in'}visible m-1 h-auto flex-nowrap self-center p-1 group-hover:visible`}
									variant="outline"
									onClick={handleTitleEditButtonClick}
								>
									<InlineIcon className="size-4" icon={`akar-icons:${titleEditable ? 'circle-check' : 'edit'}`} />
								</Button>
							</div>
							<CardDescription className="text-body">
								{versions.length} version{track?.trackVersions.length > 1 ? 's' : ''}
							</CardDescription>
						</div>
					</div>
				</CardTitle>
				<CardContent className="px-2">
					<div className="text-sm font-medium leading-none">{versionItems}</div>
				</CardContent>
				<CardFooter></CardFooter>
			</Card>
		</>
	)
}
