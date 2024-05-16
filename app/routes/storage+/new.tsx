import { createR2UploadHandler } from '#app/utils/R2UploadHandler'
import { ActionFunction, ActionFunctionArgs, json, unstable_parseMultipartFormData } from '@remix-run/cloudflare'
import { PrismaClient } from '@prisma/client/edge'
import { requireUserId } from '#app/utils/auth.server'

const acceptedContentTypes = ['audio/x-aiff', 'audio/aiff', 'audio/LPCM', 'audio/mpeg', 'audio/wav']

const createAudioFileRecord = async (
	db: PrismaClient,
	userId: string,
	key: string,
	filename: string,
	contentType: string,
	fileSize: number,
) => {
	try {
		console.log(`createAudioFileRecord for ${filename} called`)
		const result = db.audioFile.create({
			data: {
				contentType,
				fileKey: key,
				fileName: filename,
				fileSize,
				url: `/storage/${key}`,
				version: {
					create: {
						title: `filename version 1}`,
						version: 1,
						track: {
							create: {
								title: filename,
								creator: {
									connect: {
										id: userId,
									},
								},
							},
						},
					},
				},
			},
		})
		console.log('Audio file record created')
		console.log('Result:', result)
		return result
	} catch (error) {
		console.error(error)
		throw new Error('Failed to create audio file record')
	}
}

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
			try {
				await createAudioFileRecord(
					db,
					userId,
					r2Object.key,
					r2Object.customMetadata?.filename || 'unknown',
					r2Object.httpMetadata?.contentType || 'application/octet-stream',
					r2Object.size,
				)
				console.log('Audio file record created successfully')
			} catch (err) {
				console.error(err)
				throw new Error('Failed to create audio file record')
			}
		},
	})

	const formData = await unstable_parseMultipartFormData(request, r2UploadHandler)
	if (!formData || !formData.get('file')) {
		throw new Error('Error uploading file to R2 bucket')
	}

	const fileKey = formData?.get('file')?.toString()
	if (!fileKey) {
		throw new Error('Error uploading file to R2 bucket')
	}
	return json({ fileKey })
}) satisfies ActionFunction
