import { getTrackWithVersionsByTrackId, deleteTrackById } from '#app/utils/track.server'
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/cloudflare'

const publicPath = '/storage/'

export async function loader({ params, context }: LoaderFunctionArgs) {
	const notFoundResponse = new Response('Not found', { status: 404 })
	const key = getKeyFromPath(params['*'] as string)

	if (!key) {
		return new Response('Not found', { status: 404 })
	}

	const track = await getTrackWithVersionsByTrackId(context.storageContext, key)
	if (!track) {
		return notFoundResponse
	}
	return { track }
}

export async function action({ params, request, context }: ActionFunctionArgs) {
	const NotImplementedResponse = new Response('Not implemented', { status: 501 })
	const trackId = getKeyFromPath(params['*'] as string)
	const track = await getTrackWithVersionsByTrackId(context.storageContext, trackId)

	switch (request.method) {
		case 'POST': // intentional fallthrough
		case 'PUT': // intentional fallthrough
		case 'PATCH': {
			return NotImplementedResponse
		}

		case 'DELETE': {
			try {
				await deleteTrackById(context.storageContext, track.id)
				return redirect('/dashboard')
			} catch (err) {
				console.error(err)
				throw new Response('Failed to delete object', { status: 500 })
			}
		}
	}
}

function getKeyFromPath(path: string) {
	return path.replace(publicPath, '').replace(/^\//, '')
}
