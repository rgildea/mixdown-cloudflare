import { cn } from '#app/utils/misc'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import React from 'react'

interface TrackVersionButtonProps {
	className: string
	group: string
	id: string
	title: string
	checked: boolean
	onChangeActiveTrackVersion: (id: string) => void
	onChangeSelectedTrackVersion: (id: string) => void
}

const TrackVersionButton: React.FC<TrackVersionButtonProps> = ({
	className = '',
	group,
	id,
	title,
	checked,
	onChangeActiveTrackVersion,
	onChangeSelectedTrackVersion,
}) => {
	const icon = `mdi:star${checked ? '' : '-outline'}`
	return (
		<button
			type="button"
			key={id}
			className={cn(
				'justify-left mx-1 flex w-full items-center gap-2 rounded-sm py-3 hover:cursor-pointer hover:bg-gray-300/60',
				className,
			)}
			onClick={e => handleSelectedTrackVersionChange(e)}
		>
			<input
				type="radio"
				className="m-0 hidden size-5 appearance-none "
				id={group}
				checked={checked}
				// onChange={e => handleActiveTrackVersionChange(e)}
			/>
			<InlineIcon
				className="duration-250 size-4 transition-all ease-in-out checked:bg-secondary hover:scale-[200%]"
				icon={icon}
				onClick={e => handleActiveTrackVersionChange(e)}
			/>
			<label htmlFor={`group`} className="ml-2 hover:cursor-pointer">
				{title}
			</label>
		</button>
	)

	function handleActiveTrackVersionChange(
		e: React.SyntheticEvent,
	): React.ChangeEventHandler<HTMLInputElement> | undefined {
		e.preventDefault()
		e.stopPropagation()
		console.log('handleActiveTrackVersionChange', id)
		return () => onChangeActiveTrackVersion(id)
	}

	function handleSelectedTrackVersionChange(e: React.SyntheticEvent): void {
		e.preventDefault()
		e.stopPropagation()
		console.log('handleSelectedTrackVersionChange', id)
		return onChangeSelectedTrackVersion(id)
	}
}

export default TrackVersionButton
