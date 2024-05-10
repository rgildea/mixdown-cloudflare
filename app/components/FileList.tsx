import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { Form } from '@remix-run/react'

interface FileListProps {
	files?: { key: string; filename: string }[]
	setURL: (url: string) => void
}

function FileList({ files, setURL }: FileListProps) {
	// const fetcher = useFetcher({ key: 'delete' })

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-around',
				border: '2px orange solid',
			}}
		>
			{files &&
				files.map((file, index) => {
					return (
						<Form key={file.key} method="DELETE" action={`/storage/${file.key}`}>
							<div
								style={{
									display: 'flex',
									flexDirection: 'row',
									justifyContent: 'space-between',
									border: '1px black solid',
									cursor: 'pointer',
									padding: '20px',
									margin: '2px',
								}}
								onClick={() => {
									setURL(`/storage/${file.key}`)
								}}
								role="button"
								onKeyDown={e => e.key === 'Enter' && setURL(`/storage/${file.key}`)}
								tabIndex={index + 1}
							>
								<div style={{ flex: 10 }}>
									<InlineIcon icon="akar-icons:play"></InlineIcon>
									<span>{file.filename}</span>
								</div>

								<button
									className="btn text-button"
									type="submit"
									onClick={e => {
										e.stopPropagation()
									}}
									onSubmit={e => {
										e.preventDefault()
									}}
								>
									<InlineIcon icon="akar-icons:cross" />
								</button>
							</div>
						</Form>
					)
				})}
		</div>
	)
}

export default FileList
