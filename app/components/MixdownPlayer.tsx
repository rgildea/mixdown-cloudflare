import { getCurrentTrack, usePlayerContext, usePlayerDispatchContext } from '#app/contexts/PlayerContext'
import '#app/styles/player.css'
import { cn } from '#app/utils/misc'
import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { useEffect, useRef } from 'react'
import AudioPlayer from 'react-h5-audio-player'
import PlayButton from './PlayButton'
import { Button } from './ui/button'
import { CardTitle } from './ui/card'
import WaveForm from './WaveForm'

const getLatestVersionUrl = (track: TrackWithVersions) => {
	return track?.versions[0]?.audioFile?.url || ''
}

export type PlayerVisualState = 'LARGE' | 'SMALL' | 'HIDDEN'

export interface AudioPlayerProps {
	url?: string
	controller: PlayerController
}

export interface PlayerController {
	handleLoadStart?: (e: any) => void
	handleLoadedData?: (e: any) => void
	handleCanPlay?: (e: any) => void
	handleCanPlayThrough?: (e: any) => void
	handlePlay?: (e: any) => void
	handlePlayError?: (e: any) => void
	handlePlaying?: (e: any) => void
	handlePause?: (e: any) => void
	handleNext?: (e: any) => void
	handlePrev?: (e: any) => void
	handleAborted?: (e: any) => void
	handleEnded?: (e: any) => void
}

export interface MixdownPlayerProps {
	className?: string
	url?: string
	track?: TrackWithVersions
}

const PlayerViewStateToggleButton = () => {
	const context = usePlayerContext()
	const dispatch = usePlayerDispatchContext()

	const icon = `mdi-${context?.viewState === 'LARGE' ? 'chevron-down' : 'chevron-up'}`

	return (
		<Button
			onClick={() =>
				dispatch({ type: 'SET_VIEW_STATE', viewState: context?.viewState === 'LARGE' ? 'SMALL' : 'LARGE' })
			}
			variant="ghost"
			size="icon"
		>
			<InlineIcon className="size-8 sm:size-6" icon={icon} />
		</Button>
	)
}

const PlayerCloseButton = () => {
	const dispatch = usePlayerDispatchContext()
	return (
		<Button onClick={() => dispatch({ type: 'SET_VIEW_STATE', viewState: 'HIDDEN' })} variant="ghost" size="icon">
			<InlineIcon className="size-8 sm:size-6" icon="mdi:close" />
		</Button>
	)
}

const WaveFormWrapper = () => {
	const context = usePlayerContext()
	const viewState = context?.viewState || 'LARGE'
	const audioElementRef = context?.player?.current?.audio

	return (
		<WaveForm
			key="waveform"
			className={cn(viewState !== 'LARGE' ? 'hidden' : '', 'z-30 h-min w-full')}
			audioElementRef={audioElementRef}
			currentSrc={audioElementRef?.current?.currentSrc}
		/>
	)
}

export default function MixdownPlayer({ className = '' }: MixdownPlayerProps) {
	const context = usePlayerContext()
	const viewState = context?.viewState || 'LARGE'
	const dispatch = usePlayerDispatchContext()
	const playerRef = useRef<AudioPlayer>(null)
	const audioElementRef = playerRef.current?.audio
	const currentTrack = getCurrentTrack(context) || null
	// const currentTrackUrl = currentTrack ? getLatestVersionUrl(currentTrack) : ''

	useEffect(() => {
		if (!context?.player?.current || context?.player?.current !== playerRef.current) {
			dispatch({ type: 'SET_PLAYER', playerRef: playerRef })
		}
		return () => {}
	}, [context, dispatch, playerRef])

	const playerController: PlayerController = {
		handlePlay: e => {
			console.info('onPlay', e)
			dispatch({ type: 'PLAYBACK_STARTED' })
		},
		handlePlayError: e => {
			console.info('onPlayError', e)
			dispatch({ type: 'PLAYBACK_ERROR', error: e.message })
		},
		handlePause: e => {
			console.info('onPause', e)
			dispatch({ type: 'PLAYBACK_PAUSED' })
		},
		handleEnded: () => {
			dispatch({ type: 'PLAYBACK_ENDED' })
		},
		handleAborted: () => {
			dispatch({ type: 'PLAYBACK_ABORTED' })
		},
		handleNext: () => {
			// TODO: Implement
			dispatch({ type: 'PLAY_NEXT' })
		},
		handlePrev: () => {
			dispatch({ type: 'PLAY_PREV' })
		},
		handleCanPlay: () => {
			audioElementRef?.current?.play()
		},
		handleCanPlayThrough: () => {
			dispatch({ type: 'CAN_PLAY_THROUGH' })
		},
		handleLoadedData: () => {
			dispatch({ type: 'LOADED_DATA' })
		},
	}

	// console.log('MixdownPlayer', { playlist, viewState, hidden, currentTrack, currentTrackUrl })
	return (
		<>
			<div className={cn(className, viewState === 'HIDDEN' ? 'hidden ' : '' + 'w-full bg-accent p-5')}>
				<div className="flex flex-col ">
					<div className="flex">
						<div className="grow text-left">
							<>
								{/* <NavLink className="col-span-1" to={`/tracks/${currentTrack?.id}`}> */}
								<CardTitle className="flex flex-nowrap items-center text-2xl sm:text-sm">
									{currentTrack?.title}
									{context?.player?.current?.isPlaying() ? '🔊' : '🔇'}
								</CardTitle>
								{/* </NavLink> */}
								<div className="text-xs">{currentTrack?.versions[0]?.title}</div>
							</>
						</div>
						<PlayButton size="lg" />
						<PlayerViewStateToggleButton />
						<PlayerCloseButton />
					</div>
				</div>
				<AudioPlayer
					onLoadStart={playerController.handleLoadStart}
					onPlayError={playerController.handlePlayError}
					onLoadedData={playerController.handleLoadedData}
					onCanPlay={playerController.handleCanPlay}
					onCanPlayThrough={playerController.handleCanPlayThrough}
					onPlaying={playerController.handlePlaying}
					onPlay={playerController.handlePlay}
					onPause={playerController.handlePause}
					onAbort={playerController.handleAborted}
					onEnded={playerController.handleEnded}
					onClickNext={playerController.handleNext}
					onClickPrevious={playerController.handlePrev}
					showDownloadProgress={true}
					showFilledProgress={true}
					showJumpControls={false}
					showFilledVolume={true}
					showSkipControls={true}
					src={currentTrack ? getLatestVersionUrl(currentTrack) : ''}
					ref={playerRef}
					// autoPlayAfterSrcChange={false}
					// autoPlay={false}
					customAdditionalControls={[]}
					customVolumeControls={[]}
					customProgressBarSection={[<WaveFormWrapper key="wf" />]}
					customControlsSection={[]}
				/>
			</div>
		</>
	)
}
