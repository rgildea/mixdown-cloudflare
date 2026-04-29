// UploadHandler types removed from @remix-run packages in React Router v7
// Defining locally for our R2 upload handler
export type UploadHandlerPart = {
	name: string
	filename?: string
	contentType: string
	data: AsyncIterable<Uint8Array>
}
export type UploadHandler = (part: UploadHandlerPart) => Promise<File | string | null | undefined>

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
			// Convert File to AsyncIterable<Uint8Array> for our handler
			const arrayBuffer = await value.arrayBuffer()
			const uint8 = new Uint8Array(arrayBuffer)

			async function* toAsyncIterable(): AsyncIterable<Uint8Array> {
				yield uint8
			}

			const handlerResult = await uploadHandler({
				name,
				filename: value.name,
				contentType: value.type,
				data: toAsyncIterable(),
			})

			if (handlerResult != null) {
				resultFormData.set(name, handlerResult instanceof File ? handlerResult : String(handlerResult))
			}
		} else {
			resultFormData.set(name, value)
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
	const dataArray = []
	for await (const chunk of data) {
		dataArray.push(chunk)
	}

	const accumulatedData = new Uint8Array(dataArray.reduce((acc, chunk) => acc + chunk.length, 0))
	let offset = 0
	for (const chunk of dataArray) {
		accumulatedData.set(chunk, offset)
		offset += chunk.length
	}
	const key = uuidv4()

	const options: R2PutOptions = {
		httpMetadata: {
			contentType,
		},
		customMetadata: {
			filename,
		},
	}

	const r2Object = await r2Bucket.put(key, accumulatedData.buffer, options)

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
