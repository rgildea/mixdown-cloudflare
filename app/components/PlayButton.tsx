// File: app/components/PlayButton.tsx

import React, { useContext } from 'react'
import { InlineIcon } from '@iconify/react'
import { PlayerContext, PlayerDispatchContext } from '#app/contexts/PlayerContext'
import { Button } from './ui/button'

interface PlayButtonProps {
	trackId: string
	size?: 'small' | 'large'
}

const sizes = {
	small: 'size-4',
	medium: 'size-6',
	large: 'size-8',
}

const PlayButton: React.FC<PlayButtonProps> = ({ trackId, size }) => {
	const playerState = useContext(PlayerContext)
	const nowPlayingTrackId = playerState?.trackId

	const dispatch = useContext(PlayerDispatchContext)
	const isPlaying = nowPlayingTrackId === trackId
	const icon = isPlaying ? 'akar-icons:pause' : 'akar-icons:play'

	const handleClick = () => {
		dispatch({ type: 'PLAY_TRACK', trackId })
	}

	return (
		<Button variant="ghost" size="icon" className={'flex-6 p-1'} onClick={handleClick}>
			<InlineIcon className={size ? sizes[size] : sizes['medium']} icon={icon} />
		</Button>
	)
}

export default PlayButton
