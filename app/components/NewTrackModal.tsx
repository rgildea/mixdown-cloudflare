import UppyDragDropUploadForm from '#app/components/UppyDragDropUploadForm'
import ModalDialog from '#app/components/ui/modal-dialog'
import { useNavigate } from '@remix-run/react'
import { AnimatePresence } from 'framer-motion'
import { uploadEndpoint } from '../routes/tracks+/new'

type NewTrackModalProps = {
	isModalOpen: boolean
	setModalOpen: (open: boolean) => void
	onDismiss?: () => void
}

export default function NewTrackModal({ isModalOpen, onDismiss }: NewTrackModalProps) {
	const navigate = useNavigate()

	const handleDismiss = () => {
		onDismiss?.()
	}

	return (
		<>
			<h1>BADABING!!!</h1>
			<AnimatePresence onExitComplete={() => onDismiss?.()}>
				<ModalDialog isDisabled={false} title="New Track" isModalOpen={isModalOpen} handleOpenChange={handleDismiss}>
					<UppyDragDropUploadForm
						className="mt-4 pt-4"
						onSuccess={() => {
							navigate(`/tracks`)
						}}
						endpoint={uploadEndpoint}
					/>
				</ModalDialog>
			</AnimatePresence>
		</>
	)
}
