/* eslint-disable jsx-a11y/role-supports-aria-props */
import { Button } from '#app/components/ui/button'
import { usePlayerContext, usePlayerDispatchContext } from '#app/contexts/PlayerContext'
import { requireUserId } from '#app/utils/auth.server'
import {
	getTrackWithVersionsByTrackId,
	TrackWithVersions,
	updateTrack,
	updateTrackActiveVersion,
} from '#app/utils/track.server'
import { SubmissionResult, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { ActionFunctionArgs } from '@remix-run/cloudflare'
import { redirect, useActionData, useFetcher, useMatches, useRouteLoaderData } from '@remix-run/react'
import { useEffect } from 'react'
import { z } from 'zod'

export type TrackFormAction = 'set-active-version' | 'edit-title'

const schema = z.object({
	_action: z.literal('set-active-version'),
	activeTrackVersionId: z.string({ required_error: 'Track version is required' }),
})

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
		return redirect(`/tracks/${trackId}/versions`)
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

const TrackVersionsRoute: React.FC = () => {
	const matches = useMatches()
	const match = matches.find(match => match.id == 'routes/tracks+/$id')
	const data = useRouteLoaderData(match?.id ?? '') as { track: TrackWithVersions }
	const track = data.track
	const versions = track.trackVersions
	const activeTrackVersionId = track.activeTrackVersion?.id
	const lastResult = useActionData<typeof action>() as SubmissionResult // get the last action result
	const playerContext = usePlayerContext() // get the player context
	const playerDispatch = usePlayerDispatchContext() // get the player dispatch function
	// get the version from the search params, or the active track version, or the first version
	const initialTrackVersionId = playerContext?.currentTrackVersionId || activeTrackVersionId || versions[0]?.id
	if (!initialTrackVersionId) {
		throw new Error('No track version found')
	}

	// Define a form to edit the track title and description
	const [form] = useForm({
		lastResult,
		constraint: getZodConstraint(schema),
		// Validate field once user leaves the field
		shouldValidate: 'onBlur',
	})

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
						playerDispatch({ type: 'SET_SELECTED_TRACK_VERSION', track: track, versionId: v.id })
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
						playerDispatch({ type: 'SET_SELECTED_TRACK_VERSION', track: track, versionId: v.id })
					}}
				>
					<span className="ml-2 hover:cursor-pointer">{v.title}</span>
				</button>
			</div>
		)
	})

	return <div className="flex flex-col">{versionItems}</div>
}

export default TrackVersionsRoute
