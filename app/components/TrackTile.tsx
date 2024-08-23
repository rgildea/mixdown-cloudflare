import { cn } from '#app/utils/misc'
import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react'
import React from 'react'
import PlayButton from './PlayButton'

interface TrackTileProps {
	showPlaybutton?: boolean
	className?: string
	track: TrackWithVersions
	size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = {
	sm: 'size-20 sm:size-20 xl:size-20',
	md: 'size-24 sm:size-24 xl:size-24',
	lg: 'size-32 sm:size-32 xl:size-32',
	xl: 'size-38 sm:size-48 xl:size-48',
	default: 'size-24 sm:size-24 xl:size-24',
}

const TrackTile: React.FC<TrackTileProps> = ({ showPlaybutton, className, track, size }) => {
	const playButton = <PlayButton track={track} />
	const defaultCover = <InlineIcon className="mx-auto size-10 text-primary" icon={`akar-icons:music`} />

	return (
		<div
			className={cn(
				'size-md m-1 mb-4 mr-4 grid shrink-0 grow-0 items-center rounded-sm bg-gray-300',
				size ? sizes[size] : sizes.default,
				className,
			)}
		>
			{showPlaybutton ? playButton : defaultCover}
		</div>
	)
}

export { TrackTile }
