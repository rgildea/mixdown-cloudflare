import { TrackSchema } from '#app/components/EditTrackForm'
import EditTrackModal from '#app/components/EditTrackModal'
import PlayButton from '#app/components/PlayButton'
import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '#app/components/ui/card'
import { requireUserId } from '#app/utils/auth.server'
import { TrackWithVersions, getTrackWithVersionsByTrackId, updateTrack } from '#app/utils/track.server'
import { parseWithZod } from '@conform-to/zod'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/cloudflare'
import { Link, useLoaderData, useNavigate, useRevalidator, useSearchParams } from '@remix-run/react'
import { useState } from 'react'

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
	return json({ track })
}

export default function TrackRoute() {
	const { track } = useLoaderData<typeof loader>() as { track: TrackWithVersions }
	const [searchParams] = useSearchParams()
	const isEditing = searchParams.get('edit') !== null
	const [isModalOpen, setModalOpen] = useState(isEditing)
	const navigate = useNavigate()
	const { revalidate } = useRevalidator()

	const handleDismiss = () => {
		navigate(-1)
	}

	return (
		<>
			<EditTrackModal track={track} isModalOpen={isModalOpen} setIsModalOpen={setModalOpen} onDismiss={handleDismiss} />
			<Card className="flex flex-col space-y-4 p-2 sm:w-3/4">
				<CardTitle className="m-4 px-6">
					<div className="flex h-max w-full justify-between">
						<PlayButton size="large" trackId={track.id} />
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
					{track?.versions.length} version{track?.versions.length > 1 ? 's' : ''}
				</CardDescription>
				<CardContent>
					<div className="text-sm font-medium leading-none">{track.title}</div>
					{`isModalOpen: ${isModalOpen}`} <br />
					{`isEditing: ${isEditing}`}
				</CardContent>
				<CardFooter></CardFooter>
			</Card>
		</>
	)
}
