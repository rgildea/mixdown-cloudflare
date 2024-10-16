import { requireUserId } from '#app/utils/auth.server'
import { createR2UploadHandler } from '#app/utils/R2UploadHandler'
import { createTrackWithAudioFile } from '#app/utils/track.server'
import { ActionFunction, ActionFunctionArgs, json, unstable_parseMultipartFormData } from '@remix-run/cloudflare'
import * as z from 'zod'

const acceptedContentTypes = ['audio/x-aiff', 'audio/aiff', 'audio/LPCM', 'audio/mpeg', 'audio/wav']

export interface FileUploadResult {
	key: string
	filename: string
	contentType: string
	size: number
}

export const action: ActionFunction = (async ({ context, request }: ActionFunctionArgs) => {
	const bucket = context.cloudflare.env.STORAGE_BUCKET
	const storageContext = context.storageContext
	const userId = await requireUserId(storageContext, request)

	const r2UploadHandler = createR2UploadHandler({
		bucket: bucket,
		filter: ({ contentType }) => acceptedContentTypes.includes(contentType),
	})

	const formData = await unstable_parseMultipartFormData(request, r2UploadHandler)

	if (!formData || !formData.get('file')) {
		throw new Error('Error uploading file to R2 bucket')
	}

	const resp = formData?.get('file')?.toString()
	if (!resp || typeof resp !== 'string') {
		throw new Error('Error uploading file to R2 bucket')
	}

	// TODO write zod validator for this
	const fileUploadResult = JSON.parse(resp) as FileUploadResult
	const schema = z.object({
		key: z.string(),
		filename: z.string(),
		contentType: z.string(),
		size: z.number(),
	})

	const validated = schema.parse(fileUploadResult)
	console.log('validated', validated)

	const result = await createTrackWithAudioFile(
		storageContext,
		userId,
		fileUploadResult.key,
		fileUploadResult.filename || 'unknown',
		fileUploadResult.contentType || 'application/octet-stream',
		fileUploadResult.size,
	)

	console.info('Audio file record created successfully')
	return json({ result, ids: result }, { status: 200 })
}) satisfies ActionFunction
