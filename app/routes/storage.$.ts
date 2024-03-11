import {
	servePublicPathFromStorage,
	deleteObject,
} from 'app/utils/StorageUtils'

const publicPath = '/storage/'

export async function loader({ params, context }) {
	const env = context.cloudflare.env
	console.log('GET: ', params)
	const key = params['*']

	return servePublicPathFromStorage(env, key)
}

export const action = async ({ params, request, context }) => {
	const env = context.cloudflare.env
	let key
	if (params['*']) {
		key = getKeyFromPath(params['*'])
	}
	switch (request.method) {
		case 'POST': {
			/* handle "POST" */
			return new Response('Not implemented', { status: 501 })
		}
		case 'PUT': {
			/* handle "PUT" */
			return new Response('Not implemented', { status: 501 })
		}
		case 'PATCH': {
			/* handle "PATCH" */
			return new Response('Not implemented', { status: 501 })
		}
		case 'DELETE': {
			/* handle "DELETE" */
			console.log('DELETING', key)
			return deleteObject(env, key)
		}
	}
}

function getKeyFromPath(path: string) {
	return path.replace(publicPath, '').replace(/^\//, '')
}
