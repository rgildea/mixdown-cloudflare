import { Button } from '#app/components/ui/button' // Adjust the import path as necessary
import { InlineIcon } from '@iconify/react'
import React, { useEffect, useRef, useState } from 'react'

interface EditableTitleProps {
	value: string
}

const EditableTextField: React.FC<EditableTitleProps> = ({ value }) => {
	const [isEditable, setIsEditable] = useState(false)
	const textFieldRef = useRef<HTMLDivElement>(null)
	const [shouldSave, setShouldSave] = useState(false)
	const [text, setText] = useState(value)

	useEffect(() => {
		if (isEditable && textFieldRef.current) {
			const range = document.createRange()
			const selection = window.getSelection()
			const textNode = textFieldRef.current.childNodes[0]
			const textLength = textNode ? textNode.textContent?.length ?? 0 : 0
			range.setStart(textNode, textLength)
			range.setEnd(textNode, textLength)
			selection?.removeAllRanges()
			selection?.addRange(range)
			textFieldRef.current.focus()
		}
	}, [isEditable])

	const handleEditButtonClick = () => {
		console.log('handleEditButtonClick')
		console.log('setting shouldSave true')
		setShouldSave(true)
		if (isEditable && textFieldRef.current) {
			console.log('initial value', value)
			console.log('newText', textFieldRef.current.textContent)

			setText(textFieldRef.current.textContent ?? '')
		}
		toggleEdit()
	}

	const toggleEdit = () => {
		setIsEditable(!isEditable)
		setShouldSave(false)
	}

	const cancel = () => {
		console.log('cancelling')
		console.log('shouldSave', shouldSave)

		if (isEditable && textFieldRef.current) {
			if (shouldSave) {
				console.log('saving text', text)
				textFieldRef.current.textContent = value
			} else {
				console.log('resetting text', text)
				textFieldRef.current.textContent = text
			}
		}
		toggleEdit()
	}
	const renders = useRef(0)

	console.log('renders', ++renders.current)
	return (
		<div className="group flex">
			<div
				ref={textFieldRef}
				contentEditable={isEditable}
				suppressContentEditableWarning={true}
				onBlur={cancel}
				className={`flex-nowrap border-b-2 bg-inherit text-2xl font-normal caret-primary outline-none ${
					isEditable ? 'border-primary' : 'border-transparent'
				}`}
			>
				{text}
			</div>
			<Button
				className={`m-1 h-auto flex-nowrap self-center p-1 group-hover:visible ${isEditable ? '' : 'invisible'}`}
				variant="outline"
				onClick={handleEditButtonClick}
			>
				<InlineIcon className="size-4" icon={`akar-icons:${isEditable ? 'circle-check' : 'edit'}`} />
			</Button>
		</div>
	)
}

export default EditableTextField
