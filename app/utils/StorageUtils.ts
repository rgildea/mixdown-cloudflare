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

export async function deleteObject(bucket: R2Bucket, key: string) {
	await bucket.delete(key)
	return new Response('Deleted {key}')
}

export async function servePublicPathFromStorage(bucket: R2Bucket, key: string) {
	const notFoundResponse = new Response('Not found', { status: 404 })
	const object: R2ObjectBody | null = await bucket.get(key)

	if (!object) {
		return notFoundResponse
	}
	const headers = object.httpMetadata ? extractHeaders(object.httpMetadata) : new Headers()
	headers.set('etag', object.httpEtag)
	headers.delete('httpEtag')

	const response = new Response(object.body, { headers: { ...headers, 'x-hey-ho': "let's go!" } })
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
