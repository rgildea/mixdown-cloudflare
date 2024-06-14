import WaveForm from '#app/components/WaveForm'
import { PlayerContext, PlayerDispatchContext } from '#app/contexts/PlayerContext'
import '#app/styles/player.css'
import { TrackWithVersions } from '#app/utils/track.server'
import { AnimatePresence, motion } from 'framer-motion'
import { forwardRef, useContext, useEffect, useRef, useState } from 'react'
import AudioPlayer from 'react-h5-audio-player'

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
	controller: PlayerController
}

export interface PlayerController {
	handleLoadStart: (e: any) => void
	handlePlayError: (e: any) => void
	handleCanPlay: (e: any) => void
	handleCanPlayThrough: (e: any) => void
	handleLoadedData: (e: any) => void
	handlePlay: (e: any) => void
	handlePlaying: (e: any) => void
	handlePause: (e: any) => void
	handleNext: (e: any) => void
	handlePrev: (e: any) => void
	handleAbort: (e: any) => void
	handleEnded: (e: any) => void
}

// eslint-disable-next-line react/display-name
const InternalPlayerComponent = forwardRef<AudioPlayer, AudioPlayerProps>(({ url, controller }, playerRef) => {
	return (
		<AudioPlayer
			className="min-h-0"
			onLoadStart={controller.handleLoadStart}
			onPlayError={controller.handlePlayError}
			onLoadedData={controller.handleLoadedData}
			onCanPlay={controller.handleCanPlay}
			onCanPlayThrough={controller.handleCanPlayThrough}
			onPlay={controller.handlePlay}
			onPlaying={controller.handlePlaying}
			onPause={controller.handlePause}
			onAbort={controller.handleAbort}
			onEnded={controller.handleEnded}
			onClickNext={controller.handleNext}
			onClickPrevious={controller.handlePrev}
			customAdditionalControls={[]}
			showDownloadProgress={true}
			showFilledProgress={true}
			showJumpControls={false}
			showFilledVolume={true}
			showSkipControls={false}
			src={url ?? ''}
			ref={playerRef}
			customVolumeControls={[]}
			// customProgressBarSection={[RHAP_UI.CURRENT_TIME, RHAP_UI.PROGRESS_BAR, RHAP_UI.DURATION]}
		/>
	)
})

export default function MixdownPlayer() {
	const playerState = useContext(PlayerContext)
	const dispatch = useContext(PlayerDispatchContext)
	const player = useRef<AudioPlayer>(null)
	const [isWaveformHidden, setWaveformHidden] = useState<boolean>(true)
	const track = playerState?.track ?? null
	const url = track?.versions[0].audioFile?.url
	const audioElementRef = player.current?.audio

	const playerController: PlayerController = {
		handleLoadStart: e => {
			console.info('onLoadStart', e)
			dispatch({ type: 'LOAD_START', track: playerState?.track })
		},
		handlePlayError: e => {
			console.info('onPlayError', e)
			dispatch({ type: 'PLAYBACK_ERROR', error: e.message })
		},
		handleCanPlay: e => {
			console.info('onCanPlay', e)
			dispatch({ type: 'CAN_PLAY' })
		},
		handleCanPlayThrough: e => {
			console.info('onCanPlayThrough', e)
			setWaveformHidden(false)
			dispatch({ type: 'CAN_PLAY_THROUGH' })
		},
		handleLoadedData: e => {
			console.info('onLoadedData', e)
			dispatch({ type: 'LOADED_DATA' })
		},
		handlePlay: e => {
			console.info('onPlay, starting to load and play', e)
		},
		handlePlaying: e => {
			console.info('onPlaying', e)
			if (e?.base) dispatch({ type: 'PLAYBACK_STARTED' })
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

	useEffect(() => {
		if (!playerState?.player) {
			dispatch({ type: 'INIT_PLAYER', playerRef: player })
		}
	}, [playerState?.player, dispatch])

	return (
		<div className="container z-50">
			{/* <h2 className="top-0 w-min bg-accent p-2 text-center font-mono text-sm text-accent-foreground">
				{playerState?.playerState}
			</h2> */}

			<div className=" flex flex-col justify-start ">
				{/* <Button
					className=" my-1 max-w-min text-nowrap"
					size="wide"
					onClick={() => setWaveformHidden(!isWaveformHidden)}
				>
					{isWaveformHidden ? 'Show Waveform' : 'Hide Waveform'}
				</Button> */}
				<AnimatePresence>
					<motion.div
						initial={{ opacity: 0, y: -300 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -300 }}
						transition={{ y: -300, duration: 4 }}
					>
						{!isWaveformHidden && (
							<div>
								<WaveForm
									// className={`${shouldShow ? ' translate-x-0 ' : ' translate-x-full '} z-30 h-full transform overflow-auto bg-white transition-all duration-300 ease-in-out`}
									className="h-full w-full"
									audioElementRef={audioElementRef}
									currentSrc={audioElementRef?.current?.currentSrc}
								/>
							</div>
						)}
					</motion.div>
				</AnimatePresence>
			</div>

			<InternalPlayerComponent controller={playerController} url={url} ref={player} track={track || undefined} />
		</div>
	)
}
