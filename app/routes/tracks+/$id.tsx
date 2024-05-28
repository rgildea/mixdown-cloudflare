import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardFooter, CardTitle } from '#app/components/ui/card'
import { TrackWithVersions, getTrackWithVersionsByTrackId, updateTrack } from '#app/utils/track.server'
import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/cloudflare'
import { Form, Link, useActionData, useLoaderData, useSearchParams } from '@remix-run/react'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import z from 'zod'
import { StatusButton } from '#app/components/ui/status-button'
import { useIsPending } from '#app/utils/misc'
import { requireUserId } from '#app/utils/auth.server'
import { Field } from '#app/components/forms'

const TrackSchema = z.object({
	title: z.string({ required_error: 'Title is required' }).min(3).max(100),
	description: z.string({ required_error: 'Description is required' }).min(3).max(500),
})

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
	const actionData = useActionData<typeof action>()
	const [searchParams] = useSearchParams()
	const isPending = useIsPending()
	const isEditing = searchParams.get('edit') === 'true'

	const [form, fields] = useForm({
		id: 'edit-track',
		constraint: getZodConstraint(TrackSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: TrackSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<Form method="post" {...getFormProps(form)} onSubmit={form.onSubmit}>
			<Card className="flex flex-col space-y-8">
				<CardTitle className=" px-6t m-4">
					<div className="flex h-max w-full justify-between">
						<div className="text-4xl font-extrabold">{track?.title}</div>
						{isEditing ? ( // If we are editing, show the save button
							<></>
						) : (
							// <Button className="bg-secondary text-button text-secondary-foreground" asChild variant="default" size="sm">
							// 	Save
							// </Button>
							// Otherwise, show the edit button
							<Button
								className="bg-secondary text-button text-secondary-foreground"
								asChild
								variant="default"
								size="sm"
							>
								<Link to="?edit=true">
									<InlineIcon className="m-1 size-6" icon="akar-icons:edit" />
									Edit
								</Link>
							</Button>
						)}
					</div>
					<h2>
						{track?.versions.length} version{track?.versions.length > 1 ? 's' : ''}
					</h2>
				</CardTitle>
				<CardContent>
					<div id={form.errorId} className="text-s h-2 font-semibold text-input-invalid">
						{form.errors}
					</div>
					<div className="text-s h-2 font-semibold text-orange-500">
						{actionData?.result?.status === 'success' && 'Success!'}
					</div>

					<Field
						labelProps={{ htmlFor: fields.title.id, children: 'Title' }}
						inputProps={{
							...getInputProps(fields.title, { type: 'text' }),
							autoComplete: 'name',
						}}
						errors={fields.title.errors}
					/>

					{/* <div> 
								<input
							className="text-md w-full border-b-2 bg-card focus-visible:placeholder-transparent focus-visible:outline-none"
							defaultValue={fields.title.initialValue?.toString()}
							placeholder="Title"
							{...getInputProps(fields.title, { type: 'text' })}
						/> <div id={fields.title.errorId} className="mt-1 h-1 text-xs font-semibold text-input-invalid">
							{fields.title.errors}
						</div>  */}

					<Field
						labelProps={{ htmlFor: fields.description.id, children: 'Description' }}
						inputProps={{
							...getInputProps(fields.description, { type: 'text' }),
							autoComplete: 'description',
						}}
						errors={fields.description.errors}
					/>

					{/* <div>
						<input
							className="text-md w-full border-b-2 bg-card focus-visible:placeholder-transparent focus-visible:outline-none"
							placeholder="Description"
							{...getInputProps(fields.description, { type: 'text' })}
						/>
						<div id={fields.description.errorId} className="mt-1 h-1 text-xs font-semibold text-input-invalid">
							{fields.description.errors}
						</div>
					</div> */}
				</CardContent>
				<CardFooter>
					<StatusButton
						className="w-full"
						status={isPending ? 'pending' : form.status ?? 'idle'}
						type="submit"
						disabled={isPending}
					>
						Save
					</StatusButton>
				</CardFooter>
			</Card>
		</Form>
	)
}
