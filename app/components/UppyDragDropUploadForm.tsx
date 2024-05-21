import { Uppy, UppyFile } from '@uppy/core'
import '@uppy/core/dist/style.min.css'
import '@uppy/drag-drop/dist/style.min.css'
import '@uppy/progress-bar/dist/style.min.css'
import '@uppy/status-bar/dist/style.min.css'
import { DragDrop, StatusBar } from '@uppy/react'

import XHR from '@uppy/xhr-upload'
import { useState } from 'react'

interface UppyDragDropUploadFormProps {
	endpoint: string
	onSuccess: (file: UppyFile, response: any) => void
	className?: string
}

export default function UppyDragDropUploadForm({ endpoint, onSuccess, className }: UppyDragDropUploadFormProps) {
	const [uppy] = useState(() => makeUppy(endpoint, onSuccess))

	return (
		<div className="pt-4">
			<StatusBar uppy={uppy} hideAfterFinish={false} showProgressDetails={true} />
			<DragDrop
				uppy={uppy}
				className={className}
				locale={{
					strings: {
						browse: 'Choose a file',
						dropHereOr: '%{browse} or drag it here',
					},
				}}
			/>
		</div>
	)
}
function makeUppy(
	endpoint: string,
	onSuccess: (file: UppyFile, response: any) => void,
): Uppy<Record<string, unknown>, Record<string, unknown>> {
	const uppy = new Uppy({ autoProceed: true }).use(XHR, { endpoint })

	if (typeof document === 'undefined') {
		// running in a server environment
	} else {
		// running in a browser environment
		uppy
			// .use(DropTarget, {
			// 	target: document?.body,
			// })
			.on('file-added', file => {
				console.info('Added file', file)
			})
			.on('file-added', file => {
				console.info('Added file', file)
			})
			.on('upload', data => {
				console.info('Added files', data)
			})
			.on('upload-success', (file, response) => {
				console.info('upload success', file?.name, response)
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
				console.info(progress)
			})
			.on('complete', result => {
				console.info('complete', result)
			})
			.on('error', error => {
				console.error('error', error)
			})
			.on('cancel-all', () => {
				console.info('cancel all')
			})
			.on('reset-progress', () => {
				console.info('progress was reset')
			})
	}

	return uppy
}
