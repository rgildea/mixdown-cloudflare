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
import { Link, useLoaderData, useNavigate, useRevalidator, useSearchParams } from '@remix-run/react'
import { LoremIpsum } from 'lorem-ipsum'
import { useContext, useEffect, useState } from 'react'

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

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
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

	generateRandomVersions(track)

	return json({ track })
}

function generateRandomVersions(track: TrackWithVersions) {
	const lorem = new LoremIpsum({
		sentencesPerParagraph: {
			max: 8,
			min: 4,
		},
		wordsPerSentence: {
			max: 16,
			min: 4,
		},
	})
	const versions = track?.versions || []
	// tmp make more versions
	const randomTimes = Math.floor(Math.random() * 4) + 2 // Random number between 2 and 5
	let newVersions = versions

	for (let i = 1; i < randomTimes; i++) {
		newVersions = newVersions.concat(
			versions.map((v, j) => ({
				...v,
				id: (newVersions.length + j).toString(),
				title: lorem
					.generateWords(5)
					.split(' ')
					.map(w => w.charAt(0).toUpperCase() + w.slice(1))
					.join(' '),
			})),
		)
	}
	//
	track.versions = newVersions.sort((a, b) => b.id.localeCompare(a.id))
}

export default function TrackRoute() {
	const { track } = useLoaderData<typeof loader>() as { track: TrackWithVersions }
	const [searchParams] = useSearchParams()
	const isEditing = searchParams.get('edit') !== null
	const [isModalOpen, setModalOpen] = useState(isEditing)
	const navigate = useNavigate()
	const { revalidate } = useRevalidator()
	const titleDispatch = useContext(TitleDispatchContext)

	// set the title and icon for the page
	useEffect(() => {
		titleDispatch({ type: 'SET_TITLE', title: track.title ?? 'Mixdown!', icon: 'mdi:home' })
		return () => {}
	})

	const handleDismiss = () => {
		navigate('..', { replace: true, unstable_flushSync: true })
	}

	const versions = track?.versions || []

	const versionItems = versions.map(v => (
		<div key={v.id} className="justify-left flex items-center">
			<PlayButton size="sm" track={track} />
			<div className="ml-2">{v.title}</div>
		</div>
	))

	return (
		<>
			<EditTrackModal track={track} isModalOpen={isModalOpen} setIsModalOpen={setModalOpen} onDismiss={handleDismiss} />
			<Card className="flex flex-col space-y-4 p-2 sm:w-3/4">
				<CardTitle className="m-4 px-6">
					<div className="flex h-max w-full justify-between">
						<PlayButton size="lg" track={track} />
						<div className="mr-3 text-4xl ">{track?.title}</div>
						{
							<Button
								className="bg-secondary text-button text-secondary-foreground"
								asChild
								variant="default"
								size="sm"
								disabled={isModalOpen}
								onClick={() => {
									setModalOpen(true)
									revalidate()
								}}
							>
								<Link to="?edit">
									<InlineIcon className="m-1 size-6" icon="akar-icons:edit" />
									Edit
								</Link>
							</Button>
						}
					</div>
				</CardTitle>
				<CardDescription className="px-6">
					{versions.length} version{track?.versions.length > 1 ? 's' : ''}
				</CardDescription>
				<CardContent>
					<div className="text-sm font-medium leading-none">{versionItems}</div>
				</CardContent>
				<CardFooter></CardFooter>
			</Card>
		</>
	)
}
