// routes/TrackEdit.tsx

import { ActionFunction, json } from '@remix-run/cloudflare'
import { Form, useRouteLoaderData } from '@remix-run/react'
import { TrackWithVersions } from '#app/utils/track.server'

export const action: ActionFunction = async ({
	params,
	request,
	context: {
		storageContext: { db },
	},
}) => {
	const formData = await request.formData()
	console.log('formData is', formData)
	const title = formData.get('title')
	if (!title || typeof title !== 'string' || !title.trim()) {
		throw new Error('Title is required')
	}

	const updatedTrack = await db.track.update({
		where: { id: params.id },
		data: {
			title,
			// add other fields as necessary
		},
	})
	return json(updatedTrack)
}

export default function TrackEdit() {
	const result = useRouteLoaderData<{ track: TrackWithVersions }>('routes/tracks+/$id') as { track: TrackWithVersions }
	const track = result.track
	console.log('track is', result.track)
	return (
		<Form method="post">
			<label>
				Title:
				<input name="title" defaultValue={track.title || ''} required />
			</label>
			{/* add other fields as necessary */}
			<button type="submit">Save</button>
		</Form>
	)
}
