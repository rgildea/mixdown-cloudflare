import { Uppy, UppyFile } from '@uppy/core'
import '@uppy/core/dist/style.min.css'
import '@uppy/drag-drop/dist/style.min.css'
import '@uppy/progress-bar/dist/style.min.css'
import '@uppy/status-bar/dist/style.min.css'
import { DragDrop, ProgressBar, StatusBar } from '@uppy/react'
import XHR from '@uppy/xhr-upload'
import { useState } from 'react'

interface UppyDragDropUploadFormProps {
	endpoint: string
	onSuccess: (file: UppyFile, response: any) => void
}

export default function UppyDragDropUploadForm({ endpoint, onSuccess }: UppyDragDropUploadFormProps) {
	const [uppy] = useState(() => makeUppy(endpoint, onSuccess))

	return (
		<>
			<h2>Drag Drop Area</h2>
			<DragDrop
				uppy={uppy}
				locale={{
					strings: {
						browse: 'Choose a file',
						dropHereOr: '%{browse} or drag it here',
					},
				}}
			/>
			<ProgressBar uppy={uppy} />
			<StatusBar uppy={uppy} />
		</>
	)
}
function makeUppy(
	endpoint: string,
	onSuccess: (file: UppyFile, response: any) => void,
): Uppy<Record<string, unknown>, Record<string, unknown>> {
	return new Uppy({ autoProceed: true })
		.use(XHR, { endpoint })
		.on('file-added', file => {
			console.log('Added file', file)
		})
		.on('file-added', file => {
			console.log('Added file', file)
		})
		.on('upload', data => {
			console.log('Added files', data)
		})
		.on('upload-success', (file, response) => {
			console.log('upload success', file?.name, response)
			if (file) {
				onSuccess(file, response)
			} else {
				console.error('No file in upload success event')
			}
		})
		.on('upload-error', (file, error) => {
			console.error('upload error', file, error)
		})
		.on('progress', progress => {
			// progress: integer (total progress percentage)
			console.log(progress)
		})
		.on('complete', result => {
			console.log('complete', result)
		})
		.on('error', error => {
			console.error('error', error)
		})
		.on('cancel-all', () => {
			console.log('cancel all')
		})
		.on('reset-progress', () => {
			console.log('progress was reset')
		})
}
