import EditTrackForm, { TrackSchema } from '#app/components/EditTrackForm'
import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '#app/components/ui/card'
import { requireUserId } from '#app/utils/auth.server'
import { useIsPending } from '#app/utils/misc'
import { TrackWithVersions, getTrackWithVersionsByTrackId, updateTrack } from '#app/utils/track.server'
import { useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/cloudflare'
import { Link, useActionData, useLoaderData, useSearchParams } from '@remix-run/react'

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
	const isPending = useIsPending()
	const { track } = useLoaderData<typeof loader>() as { track: TrackWithVersions }
	const [searchParams] = useSearchParams()
	const isEditing = searchParams.get('edit') === 'true'
	const actionData = useActionData<typeof action>()

	const [form, fields] = useForm({
		id: 'edit-track',
		constraint: getZodConstraint(TrackSchema),
		lastResult: actionData?.result,
		defaultValue: track as TrackWithVersions,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: TrackSchema })
		},
		shouldRevalidate: 'onBlur',
		shouldValidate: 'onBlur',
	})

	return (
		<Card className="flex flex-col space-y-4 p-2">
			<CardTitle className="m-3">
				<div className="flex h-max w-full justify-between">
					<div className="mr-3 text-4xl ">{track?.title}</div>
					{isEditing ? ( // If we are editing, show the save button
						<></>
					) : (
						// <Button className="bg-secondary text-button text-secondary-foreground" asChild variant="default" size="sm">
						// 	Save
						// </Button>
						// Otherwise, show the edit button
						<Button className="bg-secondary text-button text-secondary-foreground" asChild variant="default" size="sm">
							<Link to="?edit=true">
								<InlineIcon className="m-1 size-6" icon="akar-icons:edit" />
								Edit
							</Link>
						</Button>
					)}
				</div>
			</CardTitle>
			<CardDescription className="px-6">
				{track?.versions.length} version{track?.versions.length > 1 ? 's' : ''}
			</CardDescription>
			<CardContent>{isEditing && EditTrackForm({ track, actionData, isPending, form, fields })}</CardContent>
			<CardFooter></CardFooter>
		</Card>
	)
}
