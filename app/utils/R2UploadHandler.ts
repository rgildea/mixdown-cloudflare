// UploadHandler types removed from @remix-run packages in React Router v7
// Defining locally for our R2 upload handler
export type UploadHandlerPart = {
	name: string
	filename?: string
	contentType: string
	data: AsyncIterable<Uint8Array>
}
export type UploadHandler = (part: UploadHandlerPart) => Promise<File | string | null | undefined>

async function* fileStreamToAsyncIterable(file: File): AsyncIterable<Uint8Array> {
	const reader = file.stream().getReader()
	try {
		while (true) {
			const { done, value: chunk } = await reader.read()
			if (done) break
			if (chunk) yield chunk
		}
	} finally {
		reader.releaseLock()
	}
}

/**
 * Parse a multipart/form-data request using the UploadHandler pattern.
 * Replacement for the removed unstable_parseMultipartFormData from Remix.
 * Uses Web API formData() which is supported in Cloudflare Workers.
 */
export async function parseMultipartFormData(
	request: Request,
	uploadHandler: UploadHandler,
): Promise<FormData> {
	// Use the native formData() to parse parts
	const rawFormData = await request.formData()
	const resultFormData = new FormData()

	for (const [name, value] of rawFormData.entries()) {
		if (value instanceof File) {
			const handlerResult = await uploadHandler({
				name,
				filename: value.name,
				contentType: value.type,
				data: fileStreamToAsyncIterable(value),
			})

			if (handlerResult != null) {
				// Use append instead of set to preserve multi-value fields
				resultFormData.append(name, handlerResult instanceof File ? handlerResult : String(handlerResult))
			}
		} else {
			// Use append instead of set to preserve multi-value fields
			resultFormData.append(name, value)
		}
	}

	return resultFormData
}

import { v4 as uuidv4 } from 'uuid'

export type R2Input = Parameters<R2Bucket['put']>[1]

export type R2UploadHandlerFilterArgs = {
	filename: string
	contentType: string
	name: string
}

export type CreateUploadHandlerParams = {
	bucket: R2Bucket
	filter?: (args: R2UploadHandlerFilterArgs) => boolean | Promise<boolean>
	onSuccess?: (r2Object: R2Object) => void
	maxPartSize?: number
}

export async function uploadToR2(
	r2Bucket: R2Bucket,
	data: AsyncIterable<Uint8Array>,
	filename: string,
	contentType: string,
) {
	// Stream chunks directly to R2 via a ReadableStream to avoid accumulating the
	// entire file in memory before uploading.
	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			for await (const chunk of data) {
				controller.enqueue(chunk)
			}
			controller.close()
		},
	})

	const key = uuidv4()

	const options: R2PutOptions = {
		httpMetadata: {
			contentType,
		},
		customMetadata: {
			filename,
		},
	}

	const r2Object = await r2Bucket.put(key, stream, options)

	if (r2Object == null || r2Object.key === undefined) {
		throw new Error(`Failed to upload file ${key}`)
	}

	return r2Object
}

export function createR2UploadHandler({ bucket, filter, onSuccess }: CreateUploadHandlerParams) {
	return (async ({ name, filename, contentType, data }: UploadHandlerPart) => {
		if (!filename) {
			return undefined
		}

		if (filter && !(await filter({ filename, contentType, name }))) {
			return undefined
		}

		const r2Object = await uploadToR2(bucket, data, filename, contentType)
		if (onSuccess) {
			onSuccess(r2Object)
		}

		return JSON.stringify({ trackId: 'foo', key: r2Object.key, filename, contentType, size: r2Object.size })
	}) satisfies UploadHandler
}
