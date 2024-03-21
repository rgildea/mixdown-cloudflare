import { servePublicPathFromStorage, deleteObject } from '#app/utils/StorageUtils'
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare'

const publicPath = '/storage/'

export async function loader({ params, context }: LoaderFunctionArgs) {
	const env = context.cloudflare.env
	const key = params['*']
	console.log('key', key)
	if (!key) {
		return new Response('Not found', { status: 404 })
	}

	return servePublicPathFromStorage(env.STORAGE_BUCKET, key)
}

export async function action({ params, request, context }: ActionFunctionArgs) {
	const bucket = context.cloudflare.env.STORAGE_BUCKET
	const key = getKeyFromPath(params['*'] as string)
	switch (request.method) {
		case 'POST': {
			return new Response('Not implemented', { status: 501 })
		}
		case 'PUT': {
			return new Response('Not implemented', { status: 501 })
		}
		case 'PATCH': {
			return new Response('Not implemented', { status: 501 })
		}
		case 'DELETE': {
			return deleteObject(bucket, key)
		}
	}
}

function getKeyFromPath(path: string) {
	return path.replace(publicPath, '').replace(/^\//, '')
}
