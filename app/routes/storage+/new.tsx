import { createR2UploadHandler } from '#app/utils/R2UploadHandler'
import { ActionFunction, ActionFunctionArgs, json, unstable_parseMultipartFormData } from '@remix-run/cloudflare'
import { requireUserId } from '#app/utils/auth.server'
import { createAudioFileRecord } from '#app/utils/track.server'

const acceptedContentTypes = ['audio/x-aiff', 'audio/aiff', 'audio/LPCM', 'audio/mpeg', 'audio/wav']

export const action: ActionFunction = (async ({ context, request }: ActionFunctionArgs) => {
	const bucket = context.cloudflare.env.STORAGE_BUCKET
	const db = context.storageContext.db
	const storageContext = context.storageContext
	const userId = await requireUserId(storageContext, request)
	const r2UploadHandler = createR2UploadHandler({
		bucket: bucket,
		filter: ({ contentType }) => acceptedContentTypes.includes(contentType),
		onSuccess: async r2Object => {
			console.log('R2 upload success', r2Object.key)
			console.log('Creating audio file record')
			// try {
			const result = await createAudioFileRecord(
				db,
				userId,
				r2Object.key,
				r2Object.customMetadata?.filename || 'unknown',
				r2Object.httpMetadata?.contentType || 'application/octet-stream',
				r2Object.size,
			)
			console.log('Result:', result)
			console.log('Audio file record created successfully')
			// } catch (err) {
			// 	console.error(err)
			// 	throw new Error('Failed to create audio file record')
			// }
		},
	})

	const formData = await unstable_parseMultipartFormData(request, r2UploadHandler)
	console.log('formData:', formData)
	console.log('formData.get("file"):', formData?.get('file'))
	if (!formData || !formData.get('file')) {
		throw new Error('Error uploading file to R2 bucket')
	}

	const fileKey = formData?.get('file')?.toString()
	if (!fileKey) {
		throw new Error('Error uploading file to R2 bucket')
	}
	return json({ fileKey })
}) satisfies ActionFunction
