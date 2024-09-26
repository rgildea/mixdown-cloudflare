import { requireUserId } from '#app/utils/auth.server'
import { createR2UploadHandler } from '#app/utils/R2UploadHandler'
import { addTrackVersionWithAudioFile } from '#app/utils/track.server'
import { ActionFunction, ActionFunctionArgs, json, unstable_parseMultipartFormData } from '@remix-run/cloudflare'

const acceptedContentTypes = ['audio/x-aiff', 'audio/aiff', 'audio/LPCM', 'audio/mpeg', 'audio/wav']

export const action: ActionFunction = (async ({ context, params, request }: ActionFunctionArgs) => {
	console.log('New audio file upload request')
	const bucket = context.cloudflare.env.STORAGE_BUCKET
	const storageContext = context.storageContext
	const userId = await requireUserId(storageContext, request)

	const r2UploadHandler = createR2UploadHandler({
		bucket: bucket,
		filter: ({ contentType }) => acceptedContentTypes.includes(contentType),
	})

	// const trackIdExtractor = (async ({ name, data }: UploadHandlerPart) => {
	// 	if (name === 'trackId') {
	// 		let acc = ''
	// 		for await (const chunk of data) {
	// 			acc += new TextDecoder().decode(chunk)
	// 		}
	// 		// console.log('EXTRACTED Track ID:', acc)
	// 		return acc
	// 	}
	// }) satisfies UploadHandler

	const trackId = params.id
	if (!trackId) {
		throw new Response('Invalid track id', { status: 400 })
	}

	const formData = await unstable_parseMultipartFormData(request, r2UploadHandler)

	if (!formData || !formData.get('file')) {
		throw new Error('Error uploading file to R2 bucket')
	}

	const resp = formData?.get('file')?.toString()

	if (!resp || typeof resp !== 'string') {
		throw new Error('Error uploading file to R2 bucket')
	}
	// TODO write zod validator for this
	const uploadResult: { key: string; filename: string; contentType: string; size: number } = JSON.parse(resp) as any

	const result = await addTrackVersionWithAudioFile(
		storageContext,
		userId,
		uploadResult.key,
		uploadResult.filename || 'unknown',
		uploadResult.contentType || 'application/octet-stream',
		uploadResult.size,
		trackId,
	)

	console.info('Audio file record created successfully')
	return json({ result, ids: result }, { status: 200 })
}) satisfies ActionFunction
