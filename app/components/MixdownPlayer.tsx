import { PlayerContext, PlayerDispatchContext } from '#app/contexts/PlayerContext'
import '#app/styles/player.css'
import { TrackWithVersions } from '#app/utils/track.server'
import { forwardRef, useContext, useEffect, useRef } from 'react'
import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player'
import { motion } from 'framer-motion'
export const getLatestVersionUrl = (trackId: string, tracks: TrackWithVersions[]) => {
	const found = tracks.find(track => track.id == trackId)
	return found?.versions[0].audioFile?.url
}

export type PlayerStates =
	| 'INITIAL_STATE'
	| 'LOADING'
	| 'READY_TO_PLAY'
	| 'PLAYING'
	| 'PAUSED'
	| 'ENDED'
	| 'ABORTED'
	| 'ERROR'

export interface AudioPlayerProps {
	url?: string
	track?: TrackWithVersions
	handleLoadStart: (e: any) => void
	handlePlayError: (e: any) => void
	handleCanPlay: (e: any) => void
	handlePlay: (e: any) => void
	handlePause: (e: any) => void
	handleNext: (e: any) => void
	handlePrev: (e: any) => void
	handleAbort: (e: any) => void
	handleEnded: (e: any) => void
}

export interface PlayerController {
	handleLoadStart: (e: any) => void
	handlePlayError: (e: any) => void
	handleCanPlay: (e: any) => void
	handlePlay: (e: any) => void
	handlePause: (e: any) => void
	handleNext: (e: any) => void
	handlePrev: (e: any) => void
	handleAbort: (e: any) => void
	handleEnded: (e: any) => void
}

// eslint-disable-next-line react/display-name
const InternalPlayerComponent = forwardRef<AudioPlayer, AudioPlayerProps>((props, playerRef) => {
	return (
		<AudioPlayer
			onLoadStart={props.handleLoadStart}
			onPlayError={props.handlePlayError}
			onCanPlay={props.handleCanPlay}
			onPlay={props.handlePlay}
			onPause={props.handlePause}
			onAbort={props.handleAbort}
			onEnded={props.handleEnded}
			onClickNext={props.handleNext}
			onClickPrevious={props.handlePrev}
			autoPlay={true}
			customAdditionalControls={[]}
			showDownloadProgress={true}
			showFilledProgress={true}
			showJumpControls={false}
			showFilledVolume={true}
			showSkipControls={false}
			autoPlayAfterSrcChange={true}
			src={props.url ?? ''}
			ref={playerRef}
			customVolumeControls={[]}
			customProgressBarSection={[RHAP_UI.CURRENT_TIME, RHAP_UI.PROGRESS_BAR, RHAP_UI.DURATION]}
		/>
	)
})

export default function MixdownPlayer() {
	const playerState = useContext(PlayerContext)
	const dispatch = useContext(PlayerDispatchContext)
	const player = useRef<AudioPlayer>(null)
	const playerController: PlayerController = {
		handleLoadStart: e => {
			console.info('onLoadStart', e)
			dispatch({ type: 'LOAD_START', track: playerState?.track })
		},
		handleCanPlay: e => {
			console.info('onCanPlay', e)
			dispatch({ type: 'CAN_PLAY' })
		},
		handlePlayError: e => {
			console.info('onPlayError', e)
			dispatch({ type: 'PLAYBACK_ERROR', error: e.message })
		},
		handlePlay: e => {
			console.info('onPlay', e)
			dispatch({ type: 'PLAYBACK_STARTED' })
		},
		handlePause: e => {
			console.info('onPause', e)
			dispatch({ type: 'PLAYBACK_PAUSED' })
		},
		handleEnded: e => {
			console.info('onEnded', e)
			dispatch({ type: 'PLAYBACK_ENDED' })
		},
		handleAbort: e => {
			console.info('onAbort', e)
			dispatch({ type: 'PLAYBACK_ABORTED' })
		},
		handleNext: e => {
			console.info('onClickNext', e)
			// TODO: Implement
		},
		handlePrev: e => {
			console.info('onClickPrevious', e)
			// TODO: Implement
		},
	}

	// if (playerState?.player == null || playerState?.player !== player) {
	// 	dispatch({ type: 'INIT_PLAYER', playerRef: player })
	// }

	const track = playerState?.track ?? null

	// const url = 'https://naturecreepsbeneath.com/player/1879830/tracks/3056260.mp3'
	const url = track?.versions[0].audioFile?.url
	// console.log('MixdownPlayer loading with URL: ', url)

	useEffect(() => {
		if (!playerState?.player) {
			dispatch({ type: 'INIT_PLAYER', playerRef: player })
		}
	}, [playerState?.player, dispatch])

	return (
		<div className="container z-50">
			{track && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ y: 300, duration: 2 }}
				>
					<h2 className="invisible bg-gray-900 p-2 text-center text-white">{playerState?.playerState}</h2>
					<InternalPlayerComponent {...playerController} url={url} ref={player} track={track} />
				</motion.div>
			)}
		</div>
	)
}
//
