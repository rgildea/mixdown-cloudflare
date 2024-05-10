import FileList from '#app/components/FileList'
import MixdownPlayer from '#app/components/MixdownPlayer'
import UppyDragDropUploadForm from '#app/components/UppyDragDropUploadForm'
import { createR2UploadHandler } from '#app/utils/R2UploadHandler'
import { requireUserId } from '#app/utils/auth.server'
import {
	ActionFunction,
	LoaderFunctionArgs,
	json,
	unstable_parseMultipartFormData,
	type ActionFunctionArgs,
	type MetaFunction,
} from '@remix-run/cloudflare'
import { useLoaderData, useLocation, useRevalidator } from '@remix-run/react'
import { useState } from 'react'
import 'react-h5-audio-player/lib/styles.css'

const acceptedContentTypes = ['audio/x-aiff', 'audio/aiff', 'audio/LPCM', 'audio/mpeg', 'audio/wav']

export async function loader({ context, request }: LoaderFunctionArgs) {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const userId = await requireUserId(context.storageContext, request)

	const bucket = context.cloudflare.env.STORAGE_BUCKET
	const listOptions: R2ListOptions = {
		include: ['customMetadata'],
	}

	const { objects }: R2Objects = await bucket.list(listOptions)
	return json({ objects })
}

export const action: ActionFunction = async ({ context, request }: ActionFunctionArgs) => {
	const storage = context.cloudflare.env.STORAGE_BUCKET
	const formData = await unstable_parseMultipartFormData(
		request,
		createR2UploadHandler({
			bucket: storage,
			filter: ({ contentType }) => acceptedContentTypes.includes(contentType),
		}),
	)
	console.log('File uploaded to R2 bucket')
	return json({ status: 200, key: formData.get('file') })
}

export const meta: MetaFunction = () => {
	return [
		{ title: 'Mixdown Music Player Demo' },
		{
			name: 'description',
			content: 'Welcome to Mixdown Music Player Demo!',
		},
	]
}

export default function Index() {
	const loaderData = useLoaderData<typeof loader>()
	const [currentFileURL, setCurrentFileURL] = useState<string>()
	const uploadEndpoint = useLocation().pathname
	const revalidator = useRevalidator()

	return (
		<div className="w-1/2">
			<h1>Welcome to Mixdown!</h1>
			<h2>Files</h2>
			<MixdownPlayer url={currentFileURL} />
			<FileList
				files={loaderData.objects.map(o => ({ key: o.key, filename: o.customMetadata?.filename ?? '' }))}
				setURL={setCurrentFileURL}
			/>
			<UppyDragDropUploadForm
				onSuccess={() => {
					console.log('revalidating')
					revalidator.revalidate()
				}}
				endpoint={uploadEndpoint}
			/>
		</div>
	)
}
