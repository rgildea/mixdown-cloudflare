// File: app/components/PlayButton.tsx

import React, { useContext } from 'react'
import { InlineIcon } from '@iconify/react'
import { PlayerContext, PlayerDispatchContext } from '#app/contexts/PlayerContext'
import { Button } from './ui/button'
import { TrackWithVersions } from '#app/utils/track.server'

interface PlayButtonProps {
	track: TrackWithVersions
	size?: 'small' | 'large'
}

const sizes = {
	small: 'size-4',
	medium: 'size-6',
	large: 'size-8',
}

const PlayButton: React.FC<PlayButtonProps> = ({ track, size }) => {
	const playerState = useContext(PlayerContext)
	const nowPlayingTrack = playerState?.track

	const dispatch = useContext(PlayerDispatchContext)
	const isPlaying = nowPlayingTrack?.id === track?.id
	const icon = isPlaying ? 'mdi:pause' : 'mdi:play'

	const handleClick = () => {
		dispatch({ type: 'PLAY_TRACK', track })
	}

	return (
		<Button variant="ghost" size="icon" className={'flex-6 p-1'} onClick={handleClick}>
			<InlineIcon className={size ? sizes[size] : sizes['medium']} icon={icon} />
		</Button>
	)
}

export default PlayButton
