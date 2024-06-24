import WaveForm from '#app/components/WaveForm'
import { PlayerContext, PlayerDispatchContext } from '#app/contexts/PlayerContext'
import '#app/styles/player.css'
import { cn } from '#app/utils/misc'
import { TrackWithVersions } from '#app/utils/track.server'
import { Link } from '@remix-run/react'
import { AnimatePresence } from 'framer-motion'
import { forwardRef, useContext, useEffect, useRef, useState } from 'react'
import AudioPlayer from 'react-h5-audio-player'
import { CardTitle } from './ui/card'

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
			autoPlayAfterSrcChange={true}
			customAdditionalControls={[]}
			showDownloadProgress={true}
			showFilledProgress={true}
			showJumpControls={false}
			showFilledVolume={true}
			showSkipControls={false}
			src={url}
			ref={playerRef}
			// customVolumeControls={[]}
			autoPlayAfterSrcChange={false}
			autoPlay={false}
			// customProgressBarSection={[RHAP_UI.CURRENT_TIME, RHAP_UI.PROGRESS_BAR, RHAP_UI.DURATION]}
		/>
	)
})
export interface MixdownPlayerProps {
	className?: string
	url?: string
	track?: TrackWithVersions
}

export default function MixdownPlayer({ url, className = '' }: MixdownPlayerProps) {
	const [isWaveformHidden, setWaveformHidden] = useState<boolean>(true)

	const dispatch = useContext(PlayerDispatchContext)
	const playerState = useContext(PlayerContext)
	const player = useRef<AudioPlayer>(null)

	useEffect(() => {
		if (!playerState?.player) {
			dispatch({ type: 'INIT_PLAYER', playerRef: player })
		}
	}, [playerState?.player, dispatch])

	const track = playerState?.track ?? null
	if (!track) return null

	const newSourceUrl = url || getLatestVersionUrl(track.id, [track])
	// const url = track?.versions[0].audioFile?.url ?? ''

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

	return (
		// merge classes that were passed in with the default classes
		<div className={cn(className, 'min-h-min w-full bg-yellow-500/90')}>
			{/* <h2 className="top-0 w-min bg-accent p-2 text-center font-mono text-sm text-accent-foreground">
				{playerState?.playerState}
			</h2> */}

			<div className="flex flex-col justify-start ">
				<AnimatePresence>
					{!isWaveformHidden && (
						<div>
							<WaveForm
								// className={`${shouldShow ? ' translate-x-0 ' : ' translate-x-full '} z-30 h-full transform overflow-auto bg-white transition-all duration-300 ease-in-out`}
								className="z-30 h-64 w-full"
								audioElementRef={audioElementRef}
								currentSrc={audioElementRef?.current?.currentSrc}
							/>
						</div>
					)}
				</AnimatePresence>
			</div>
			<div className="text-left">
				{track && (
					<div className="relative -inset-y-16">
						<Link className="col-span-1" to="/">
							<CardTitle className="flex flex-nowrap items-center text-xl sm:text-4xl">{track?.title}</CardTitle>
						</Link>
						<div className="text-xs">{newSourceUrl}</div>
					</div>
				)}
			</div>
			<InternalPlayerComponent
				controller={playerController}
				url={newSourceUrl}
				ref={player}
				track={track || undefined}
			/>
		</div>
	)
}
