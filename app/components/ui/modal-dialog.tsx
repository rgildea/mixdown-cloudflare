import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import { PropsWithChildren } from 'react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

export default function ModalDialog(
	props: PropsWithChildren<{
		title?: string
		isDisabled?: boolean
		isModalOpen?: boolean
		setIsModalOpen?: (open: boolean) => void
		handleOpenChange?: () => void
	}>,
) {
	const { title, isDisabled, isModalOpen, setIsModalOpen, handleOpenChange } = props

	function handleDismissClicked() {
		setIsModalOpen?.(false)
	}

	return (
		<Dialog.Root open={isModalOpen} onOpenChange={handleOpenChange}>
			<Dialog.Portal>
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
				<Dialog.Content className="container fixed inset-0 z-50 w-full max-w-md p-10">
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ duration: 0.15 }}
						role="dialog"
						aria-modal="true"
						aria-labelledby="modal-title"
					>
						<Card className="text-card-foreground">
							<CardHeader className="flex flex-row justify-between">
								<div>
									<CardTitle className="text-4xl font-extrabold">
										<Dialog.Title>{title}</Dialog.Title>
									</CardTitle>
									<CardDescription>Upload a track to get started.</CardDescription>
								</div>

								<Dialog.Close asChild>
									{!isDisabled && <Button onClick={handleDismissClicked}>Close</Button>}
								</Dialog.Close>
							</CardHeader>
							<CardContent className="flex flex-col space-y-8">{props.children}</CardContent>
						</Card>
					</motion.div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
