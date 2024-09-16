import UppyDragDropUploadForm from '#app/components/UppyDragDropUploadForm'
import ModalDialog from '#app/components/ui/modal-dialog'
import { TrackWithVersions } from '#app/utils/track.server'
import { useNavigate } from '@remix-run/react'
import { AnimatePresence } from 'framer-motion'
import { uploadEndpoint } from '../routes/tracks+/new'

type NewVersionModalProps = {
	isModalOpen: boolean
	setIsModalOpen: (open: boolean) => void
	onDismiss?: () => void
	track?: TrackWithVersions
}

export default function NewVersionModal({ isModalOpen, setIsModalOpen, onDismiss, track }: NewVersionModalProps) {
	const navigate = useNavigate()
	const onSuccessUrl = track ? `/tracks/${track?.id}` : '/tracks'
	const handleDismiss = () => {
		onDismiss?.()
	}

	return (
		<>
			<AnimatePresence onExitComplete={() => onDismiss?.()}>
				<ModalDialog
					isDisabled={false}
					title="New Version"
					description={'Upload a new version of your track.'}
					setIsModalOpen={setIsModalOpen}
					isModalOpen={isModalOpen}
					handleOpenChange={handleDismiss}
				>
					<UppyDragDropUploadForm
						className="mt-4 pt-4"
						onSuccess={() => {
							navigate(onSuccessUrl, { replace: true })
						}}
						endpoint={uploadEndpoint}
					/>
				</ModalDialog>
			</AnimatePresence>
		</>
	)
}
