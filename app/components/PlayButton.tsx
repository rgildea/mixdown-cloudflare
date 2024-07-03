// File: app/components/PlayButton.tsx

import { PlayerContext, PlayerDispatchContext, getCurrentTrack } from '#app/contexts/PlayerContext'
import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react'
import React, { useContext } from 'react'
import { Button } from './ui/button'

interface PlayButtonProps {
	track: TrackWithVersions
	size?: 'small' | 'medium' | 'large'
}

const sizes = {
	small: 'size-6 sm:size-4 xl:size-6',
	medium: 'size-8 sm:size-6 xl:size-8',
	large: 'size-12 sm:size-8 xl:size-10',
}

const PlayButton: React.FC<PlayButtonProps> = ({ track, size }) => {
	const context = useContext(PlayerContext)
	const dispatch = useContext(PlayerDispatchContext)
	const nowPlayingTrack = getCurrentTrack(context)
	const isTrackLoaded = nowPlayingTrack?.id === track?.id
	const isPlaying = context?.player?.current?.isPlaying() || false
	let icon = 'mdi:exclamation'

	icon = `mdi:${isTrackLoaded ? (isPlaying ? 'pause-circle' : 'play-circle') : 'play-circle-outline'}`

	const handleClick = () => {
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
		<Button variant="playbutton" size="icon" className="p-1" onClick={handleClick}>
			<InlineIcon className={size ? sizes[size] : sizes['medium']} icon={icon} />
		</Button>
	)
}

export default PlayButton
