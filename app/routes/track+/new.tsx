import { ActionFunction, ActionFunctionArgs, json } from '@remix-run/cloudflare'
import { requireUserId } from '#app/utils/auth.server'
import { createTrack } from '#app/utils/track.server'

export const action: ActionFunction = (async ({ context, request }: ActionFunctionArgs) => {
	const storageContext = context.storageContext
	const userId = await requireUserId(storageContext, request)
	const track = createTrack(storageContext, userId, 'new track')
	if (!track) {
		return new Response('Failed to create track', { status: 500 })
	}
	return json({ track })
}) satisfies ActionFunction
