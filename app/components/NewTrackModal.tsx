import UppyDragDropUploadForm from '#app/components/UppyDragDropUploadForm'
import ModalDialog from '#app/components/ui/modal-dialog'
import { useNavigate } from '@remix-run/react'
import { AnimatePresence } from 'framer-motion'
export const uploadEndpoint = '/storage/new'

type NewTrackModalProps = {
	isModalOpen: boolean
	setIsModalOpen: (open: boolean) => void
	onDismiss?: () => void
}

export default function NewTrackModal({ isModalOpen, setIsModalOpen, onDismiss }: NewTrackModalProps) {
	const navigate = useNavigate()

	const handleDismiss = () => {
		onDismiss?.()
	}

	return (
		<>
			<AnimatePresence onExitComplete={() => onDismiss?.()}>
				<ModalDialog
					isDisabled={false}
					title="New Track"
					description={'Upload a track to get started.'}
					setIsModalOpen={setIsModalOpen}
					isModalOpen={isModalOpen}
					handleOpenChange={handleDismiss}
				>
					<UppyDragDropUploadForm
						className="mt-4 pt-4"
						onSuccess={() => {
							navigate('/tracks', { replace: true })
						}}
						endpoint={uploadEndpoint}
					/>
				</ModalDialog>
			</AnimatePresence>
		</>
	)
}
