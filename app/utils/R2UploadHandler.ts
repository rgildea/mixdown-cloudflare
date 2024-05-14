import type { UploadHandler, UploadHandlerPart } from '@remix-run/cloudflare'
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

	// console.log('Uploaded file to R2 bucket', r2Object)

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
			console.log('calling onSuccess')
			onSuccess(r2Object)
		}
		return r2Object.key
	}) satisfies UploadHandler
}
