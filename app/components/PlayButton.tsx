// File: app/components/PlayButton.tsx

import { getCurrentTrack, usePlayerContext, usePlayerDispatchContext } from '#app/contexts/PlayerContext'
import { cn } from '#app/utils/misc'
import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react'
import React from 'react'
import { Button } from './ui/button'

interface PlayButtonProps {
	className?: string
	track?: TrackWithVersions | null
	size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = {
	sm: 'size-6 sm:size-6 xl:size-6',
	md: 'size-8 sm:size-8 xl:size-8',
	lg: 'size-10 sm:size-10 xl:size-10',
	xl: 'size-12 sm:size-12 xl:size-12',
}

const PlayButton: React.FC<PlayButtonProps> = ({ className, size }) => {
	const context = usePlayerContext()
	const track = getCurrentTrack(context)
	const dispatch = usePlayerDispatchContext()
	const nowPlayingTrack = getCurrentTrack(context)
	const isTrackLoaded = nowPlayingTrack?.id === track?.id
	const isPlaying = context?.player?.current?.isPlaying() || false
	let icon = 'mdi:exclamation'

	if (!track) return <></>

	icon = `mdi:${isTrackLoaded ? (isPlaying ? 'pause-circle' : 'play-circle') : 'play-circle-outline'}`

	const handleClick = () => {
		if (!track) return
		console.log(
			`${track.title} (${track.id})clicked. isThisTrackLoaded? ${isTrackLoaded} isPlaying? ${isPlaying}	nowPlayingTrack? ${nowPlayingTrack?.id}`,
		)

		if (!isTrackLoaded) {
			dispatch({ type: 'PLAY_TRACK', track })
			return
		}

		if (isPlaying) {
			dispatch({ type: 'PAUSE' })
			return
		}

		dispatch({ type: 'PLAY_TRACK', track })
	}

	return (
		<Button variant="playbutton" size="icon" className={cn(className, 'rounded-full p-2')} onClick={handleClick}>
			<InlineIcon className={size ? sizes[size] : sizes['md']} icon={icon} />
		</Button>
	)
}

export default PlayButton
