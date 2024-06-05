import { requireUserId } from '#app/utils/auth.server'
import { checkHoneypot } from '#app/utils/honeypot.server'
import { createTrack } from '#app/utils/track.server'
import { parseWithZod } from '@conform-to/zod'
import { ActionFunction, ActionFunctionArgs, LoaderFunction, json, redirect } from '@remix-run/cloudflare'
import { useState } from 'react'
import z from 'zod'
import NewTrackModal from '../../components/NewTrackModal'
export const uploadEndpoint = '/storage/new'

const redirectTo = '/'
const title = z.string({ required_error: 'Title is required' }).min(3).max(100)
const TrackSchema = z.object({ title })

export const loader: LoaderFunction = async () => {
	return json({}, { status: 200 })
}

export const action: ActionFunction = async ({
	context: {
		storageContext,
		cloudflare: {
			env: { HONEYPOT_SECRET },
		},
	},
	request,
}: ActionFunctionArgs) => {
	const userId = await requireUserId(storageContext, request)
	const formData = await request.formData()
	checkHoneypot(formData, HONEYPOT_SECRET)

	const submission = await parseWithZod(formData, {
		schema: TrackSchema,
		async: true,
	})

	if (submission.status !== 'success') {
		return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
	}
	const { title } = submission.value
	let track = null

	try {
		track = await createTrack(storageContext, userId, title)
	} catch (err) {
		console.error(err)
		return json({ result: submission.reply({ formErrors: ['Cannot create track'] }) }, { status: 400 })
	}

	if (track) {
		return redirect(redirectTo)
	} else {
		return json({ result: submission.reply() }, { status: 400 })
	}
}

export default function NewTrackRoute() {
	const [isModalOpen, setModalOpen] = useState(true)

	return isModalOpen && <NewTrackModal isModalOpen={isModalOpen} setIsModalOpen={setModalOpen} />
}
