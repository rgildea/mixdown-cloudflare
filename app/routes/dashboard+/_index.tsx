import FileList from '#app/components/FileList'
import MixdownPlayer from '#app/components/MixdownPlayer'
import UploadForm from '#app/components/UploadForm'
import { createR2UploadHandler } from '#app/utils/R2UploadHandler'
import {
	ActionFunction,
	LoaderFunctionArgs,
	json,
	unstable_parseMultipartFormData,
	type ActionFunctionArgs,
	type MetaFunction,
} from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import 'react-h5-audio-player/lib/styles.css'

const acceptedContentTypes = ['audio/x-aiff', 'audio/aiff', 'audio/LPCM', 'audio/mpeg', 'audio/wav']

export async function loader({ context }: LoaderFunctionArgs) {
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

	return (
		<div className="w-1/2">
			<h1>Welcome to Mixdown!</h1>
			<h2>Files</h2>
			<FileList
				files={loaderData.objects.map(o => ({ key: o.key, filename: o.customMetadata?.filename ?? '' }))}
				setURL={setCurrentFileURL}
			/>
			<UploadForm />
			<MixdownPlayer url={currentFileURL} />
		</div>
	)
}
