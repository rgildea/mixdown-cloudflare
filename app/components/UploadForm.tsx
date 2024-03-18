import { useFileUpload } from '#app/hooks/useFileUpload'

function UploadForm() {
	const { fetcher, submit, isUploading, allFiles } = useFileUpload()
	return (
		<fetcher.Form method="post" encType="multipart/form-data">
			<h2>Upload a file</h2>
			<label>
				{isUploading && <h3>Uploading...</h3>}
				<input
					name="file"
					type="file"
					// style={{ display: "none" }}
					onChange={event => submit(event.currentTarget.files)}
					multiple
				/>
			</label>
			<ul>
				{allFiles.map(file => (
					<li key={file.name}>
						<p>
							{file.name}: {file.url}
						</p>
					</li>
				))}
			</ul>
		</fetcher.Form>
	)
}

export default UploadForm
