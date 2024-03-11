export type R2Input = Parameters<R2Bucket['put']>[1]
export type BucketConfig = {
	bucketName: string
	binding: R2Bucket
}

export function getKeyFromFileName(fileName: string) {
	return encodeURIComponent(fileName)
}

export function getFileNameFromKey(key: string) {
	return decodeURIComponent(key)
}

export async function deleteObject(env, key: string) {
	const bucket = env.STORAGE_BUCKET
	console.log('DELETING', key)
	await bucket.delete(key)
	return new Response('Deleted {key}')
}

export async function servePublicPathFromStorage(env, key: string) {
	const bucket = env.STORAGE_BUCKET
	const notFoundResponse = new Response('Not found', { status: 404 })
	console.log('SERVING', key)
	const object: R2ObjectBody | null = await bucket.get(key)

	if (!object) {
		console.log('File not found for key:', key)
		return notFoundResponse
	}

	console.log('Serving', key, object.size, 'bytes')
	console.log('HTTP Metadata', object.httpMetadata)
	console.log('Custom Metadata', object.customMetadata)

	const headers = extractHeaders(object.httpMetadata)
	headers.set('etag', object.httpEtag)
	headers.delete('httpEtag')

	const response = new Response(object.body, { headers: headers })
	return response
}

export function extractHeaders(httpMetadata: R2HTTPMetadata) {
	const headers = new Headers()
	for (const [key, value] of Object.entries(httpMetadata)) {
		headers.set(getHTTPHeaderName(key), value)
	}
	return headers
}

function getHTTPHeaderName(key: string) {
	return key.replace(/([A-Z])/g, '-$1').toLowerCase()
}
