// File: app/components/PlayButton.tsx

import { PlayerContext, PlayerDispatchContext } from '#app/contexts/PlayerContext'
import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react'
import React, { useContext } from 'react'
import { Button } from './ui/button'

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
	const isLoaded = nowPlayingTrack?.id == track?.id
	const isPlaying = playerState?.player?.current?.isPlaying()
	// const isPlaying = ['PLAYING', 'READY_TO_PLAY'].includes(playerState?.playerState || '')
	let icon = 'mdi:exclamation'

	icon = `mdi:${isLoaded ? (isPlaying ? 'pause-circle' : 'play-circle') : 'play-circle-outline'}`

	const handleClick = () => {
		console.log(
			`${track.title} (${track.id})clicked. isLoaded? ${isLoaded} isPlaying? ${isPlaying}	nowPlayingTrack? ${nowPlayingTrack?.id}`,
		)

		if (!isLoaded) {
			dispatch({ type: 'PLAY_TRACK', track })
			return
		}

		if (isPlaying) {
			dispatch({ type: 'PAUSE' })
			return
		}

		dispatch({ type: 'PLAY_TRACK', track })

		// switch (playerState?.playerState) {
		// 	case 'PLAYING':
		// 		console.log('PAUSE')
		// 		dispatch({ type: 'PAUSE' })
		// 		return

		// 	case 'READY_TO_PLAY':
		// 		console.log('PLAY')
		// 		if (playerState.player?.current?.isPlaying) {
		// 			console.log('PAUSE')
		// 			dispatch({ type: 'PAUSE' })
		// 			return
		// 		}
		// 		dispatch({ type: 'PLAY_TRACK', track })
		// 		return

		// 	case 'LOADING':
		// 		console.log('PAUSE')
		// 		dispatch({ type: 'PAUSE' })
		// 		return

		// 	case 'INITIAL_STATE':
		// 		console.log('PLAY_TRACK', track)
		// 		dispatch({ type: 'PLAY_TRACK', track })
		// 		return

		// 	case 'PAUSED':
		// 		console.log('PLAY')
		// 		dispatch({ type: 'PLAY_TRACK', track })
		// 		return

		// 	case 'ENDED':
		// 		console.log('PLAY')
		// 		dispatch({ type: 'RESTART_TRACK', track })
		// 		return

		// 	default:
		// 		console.log('PAUSE')
		// 		dispatch({ type: 'PAUSE' })
		// 		return
		// }
	}

	return (
		<Button variant="ghost" size="icon" className={'p-1'} onClick={handleClick}>
			<InlineIcon className={size ? sizes[size] : sizes['medium']} icon={icon} />
		</Button>
	)
}

export default PlayButton
