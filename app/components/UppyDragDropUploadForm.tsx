import { cn } from '#app/utils/misc'
import { Meta } from '@remix-run/react'
import { Uppy, UppyFile } from '@uppy/core'
import '@uppy/core/dist/style.min.css'
import '@uppy/drag-drop/dist/style.min.css'
import DropTarget from '@uppy/drop-target'
import { DragDrop, StatusBar } from '@uppy/react'
import '@uppy/status-bar/dist/style.min.css'
import XHR from '@uppy/xhr-upload'

import { useState } from 'react'

interface UppyDragDropUploadFormProps {
	endpoint: string
	onSuccess: (file: UppyFile<Meta, Body>, response: any) => void
	className?: string
	trackId?: string
}

export default function UppyDragDropUploadForm({
	endpoint,
	onSuccess,
	className,
	trackId,
}: UppyDragDropUploadFormProps) {
	const [uppy] = useState(() => makeUppy(endpoint, onSuccess, trackId))

	return (
		<div className={cn(className, 'flex w-full flex-col items-center')}>
			<StatusBar uppy={uppy} hideAfterFinish={false} showProgressDetails={true} />
			<DragDrop
				uppy={uppy}
				locale={{
					strings: {
						browse: 'Choose a file',
						dropHereOr: '%{browse} or drag it here',
					},
					pluralize: (n: number) => (n === 1 ? 0 : 1),
				}}
			/>
		</div>
	)
}

type Meta = { trackId: string }
type Body = { trackId: string }

function makeUppy(
	endpoint: string,
	onSuccess: (file: UppyFile<Meta, Body>, response: any) => void,
	trackId?: string,
): Uppy<Meta, Body> {
	const uppy = new Uppy<Meta, Body>({ autoProceed: false }).use(XHR, { endpoint })

	if (typeof document === 'undefined') {
		// running in a server environment
	} else {
		// running in a browser environment
		uppy
			// .use(StatusBar<Meta, Body>, { target: '#status-bar', hideAfterFinish: false, showProgressDetails: true })
			// .use(ProgressBar<Meta, Body>, { target: '#progress-bar', hideAfterFinish: false, fixed: true })
			.use(DropTarget<Meta, Body>, {
				target: document?.body,
			})
			.on('file-added', file => {
				console.info('Added file', file)
				if (trackId) {
					uppy.setFileMeta(file.id, {
						trackId,
					})
				}
			})
			.on('upload', data => {
				console.info('Uploading files', data)
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
	}

	return uppy
}
