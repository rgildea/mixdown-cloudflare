import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import { PropsWithChildren } from 'react'
import { Icon } from './icon'

export default function ModalDialog(
	props: PropsWithChildren<{
		title?: string
		isDisabled?: boolean
		isModalOpen?: boolean
		setModalOpen?: (isOpen: boolean) => void
		onDismiss: () => void
	}>,
) {
	const { title, isDisabled, onDismiss, isModalOpen, setModalOpen } = props

	function handleDismissClicked() {
		onDismiss()
	}

	return (
		<Dialog.Root open={isModalOpen} onOpenChange={setModalOpen}>
			<Dialog.Overlay>
				<div className="fixed inset-0 z-30">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.75 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.35 }}
						className="absolute inset-0 bg-zinc-700"
					/>
				</div>
			</Dialog.Overlay>
			<Dialog.Content className="z-50 rounded bg-popover p-10 text-popover-foreground">
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={{ duration: 0.15 }}
					className=" inset-0 z-40 flex flex-col items-center justify-center"
					role="dialog"
					aria-modal="true"
					aria-labelledby="modal-title"
				>
					<Dialog.Title className="bg-background font-semibold text-popover-foreground ">{title}</Dialog.Title>
					<Dialog.Description className="bg-background text-popover-foreground " />
					<Dialog.Close asChild>
						{!isDisabled && <Icon className="right-2 top-2" onClick={handleDismissClicked} name="exit" />}
					</Dialog.Close>
					<Dialog.Close />
					{props.children}
				</motion.div>
			</Dialog.Content>
		</Dialog.Root>
	)
}
