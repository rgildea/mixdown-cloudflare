import { InlineIcon } from '@iconify/react/dist/iconify.js'
import React from 'react'

interface RadioButtonProps {
	group: string
	id: string
	title: string
	checked: boolean
	onChange: (id: string) => void
}

const RadioButton: React.FC<RadioButtonProps> = ({ group, id, title, checked, onChange }) => {
	const icon = `mdi:star${checked ? '' : '-outline'}`
	return (
		<button
			type="button"
			key={id}
			className="justify-left flex w-full items-center gap-2 rounded-sm p-1 py-2 odd:bg-gray-200 hover:cursor-pointer hover:bg-gray-300/60"
			onClick={() => onChange(id)}
		>
			<input
				type="radio"
				className="m-0 hidden size-5 appearance-none border-2 border-primary transition-all duration-100 ease-in-out"
				id={group}
				checked={checked}
				onChange={() => console.log('onChange', id)}
			/>
			<InlineIcon
				className="size-4 transition-all duration-1000 ease-in-out checked:bg-secondary hover:scale-125"
				icon={icon}
			/>
			<label htmlFor={`group`} className="ml-2">
				{title}
			</label>
		</button>
	)
}

export default RadioButton
