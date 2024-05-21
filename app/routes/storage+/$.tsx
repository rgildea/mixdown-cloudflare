import { deleteObject, extractHeaders } from '#app/utils/StorageUtils'
import { TrackNotFoundError, deleteTrackByAudioFile } from '#app/utils/track.server'
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from '@remix-run/cloudflare'

const publicPath = '/storage/'

export async function loader({ params, context }: LoaderFunctionArgs) {
	const notFoundResponse = new Response('Not found', { status: 404 })

	const env = context.cloudflare.env
	const key = params['*']
	if (!key) {
		return new Response('Not found', { status: 404 })
	}

	// const response = await servePublicPathFromStorage(env.STORAGE_BUCKET, key)
	const object: R2ObjectBody | null = await env.STORAGE_BUCKET.get(key)
	if (!object) {
		return notFoundResponse
	}

	const headers = object.httpMetadata ? extractHeaders(object.httpMetadata) : new Headers()
	const customMetadata = object.customMetadata || {}

	headers.set('etag', object.httpEtag)
	headers.delete('httpEtag')
	headers.set('filename', customMetadata.filename || 'unknown')
	headers.set('Content-Length', object.size.toString())
	headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
	headers
	const response = new Response(object.body, { headers, status: 200, statusText: 'OK' })

	return response
}

export async function action({ params, request, context }: ActionFunctionArgs) {
	const NotImplementedResponse = new Response('Not implemented', { status: 501 })
	const bucket = context.cloudflare.env.STORAGE_BUCKET
	const key = getKeyFromPath(params['*'] as string)

	switch (request.method) {
		case 'POST': // intentional fallthrough
		case 'PUT': // intentional fallthrough
		case 'PATCH': {
			return NotImplementedResponse
		}

		case 'DELETE': {
			if (key === undefined || !key || !key.length) {
				throw new Response(`Track with key ${key} was not found.`, { status: 404 })
			}

			try {
				await deleteTrackByAudioFile(context.storageContext, key)
			} catch (err) {
				if (err instanceof TrackNotFoundError) {
					throw new Response(`Track with key ${key} was not found.`, { status: 404 })
				}
			}

			try {
				await deleteObject(bucket, key)
			} catch (err) {
				console.log(err)
				throw new Response(`Failed to delete object from R2 with key ${key}`, { status: 500 })
			}

			return redirect('/tracks')
		}
	}
}

function getKeyFromPath(path: string) {
	return path.replace(publicPath, '').replace(/^\//, '')
}
