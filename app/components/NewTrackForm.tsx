import { useNavigate } from '@remix-run/react'

import UppyDragDropUploadForm from './UppyDragDropUploadForm'

export default function NewTrackForm() {
	const uploadEndpoint = '/storage/new'

	const navigate = useNavigate()

	return (
		<UppyDragDropUploadForm
			className="mt-4 pt-4"
			onSuccess={(file, resp) => {
				navigate(`/tracks/${resp.trackId}?edit`)
			}}
			endpoint={uploadEndpoint}
		/>
	)
}
