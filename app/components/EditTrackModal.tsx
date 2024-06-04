import ModalDialog from '#app/components/ui/modal-dialog'
import { AnimatePresence } from 'framer-motion'
import EditTrackForm from './EditTrackForm'
import { TrackWithVersions } from '#app/utils/track.server'

type EditTrackModalProps = {
	track: TrackWithVersions
	isModalOpen: boolean
	setIsModalOpen: (open: boolean) => void
	onDismiss?: () => void
	onSubmit?: () => void
}

export default function EditTrackModal({
	track,
	isModalOpen,
	setIsModalOpen,
	onDismiss,
	onSubmit,
}: EditTrackModalProps) {
	const setModalOpen = (value: boolean) => {
		setIsModalOpen(value)
	}
	const handleDismiss = () => {
		setModalOpen?.(false)
		onDismiss?.()
	}

	const handleCancel = () => {
		setModalOpen?.(false)
		onDismiss?.()
	}

	const handleSubmit = () => {
		setModalOpen?.(false)
		onSubmit?.()
	}

	return (
		<>
			<AnimatePresence onExitComplete={() => onDismiss?.()}>
				<ModalDialog
					isDisabled={false}
					title="Edit Track"
					description="Update your track details."
					isModalOpen={isModalOpen}
					setIsModalOpen={setModalOpen}
					handleOpenChange={handleDismiss}
				>
					<EditTrackForm track={track} onCancelButtonClicked={handleCancel} onSubmitButtonClicked={handleSubmit} />
				</ModalDialog>
			</AnimatePresence>
		</>
	)
}
