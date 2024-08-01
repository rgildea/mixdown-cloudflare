import { getCurrentTrack, usePlayerContext, usePlayerDispatchContext } from '#app/contexts/PlayerContext'
import '#app/styles/player.css'
import { cn } from '#app/utils/misc'
import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { NavLink } from '@remix-run/react'
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
	handleSeeking?: (e: any) => void
	handleSeeked?: (e: any) => void
	handleJumpBackward?: (e: any) => void
	handleJumpForward?: (e: any) => void
	handleChangeCurrentTimeError?: () => void
}

export interface MixdownPlayerProps {
	className?: string
	url?: string
	track?: TrackWithVersions
}

const PlayerViewStateToggleButton = () => {
	const context = usePlayerContext()
	const dispatch = usePlayerDispatchContext()

	const icon = `mdi-${context?.viewSize === 'LARGE' ? 'chevron-down' : 'chevron-up'}`

	return (
		<Button onClick={() => dispatch({ type: 'TOGGLE_VIEW_SIZE' })} variant="ghost" size="icon">
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
	const viewState = context?.viewSize || 'LARGE'
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
	const isLoading = context?.isLoading ?? true
	const isSeeking = context?.isSeeking ?? true
	const viewState = context?.viewState
	const viewSize = context?.viewSize
	const dispatch = usePlayerDispatchContext()
	const playerRef = useRef<AudioPlayer>(null)
	const currentTrack = getCurrentTrack(context) || null
	const loadCounter = useRef(0)

	useEffect(() => {
		if (!context?.player?.current) {
			dispatch({ type: 'SET_PLAYER', playerRef: playerRef })
		} else if (context?.player?.current !== playerRef.current) {
			dispatch({ type: 'SET_PLAYER', playerRef: playerRef })
		}
		loadCounter.current++
		console.log('Player loadCounter:', loadCounter.current)
		return () => {}
	}, [dispatch, playerRef, context?.player])

	const playerController: PlayerController = {
		handleLoadStart: () => {
			dispatch({ type: 'LOAD_START' })
		},
		handlePlay: () => {
			dispatch({ type: 'PLAYBACK_STARTED' })
		},
		handlePlayError: e => {
			dispatch({ type: 'PLAYBACK_ERROR', error: e.message })
		},
		handlePause: () => {
			dispatch({ type: 'PLAYBACK_PAUSED' })
		},
		handleEnded: () => {
			dispatch({ type: 'PLAYBACK_ENDED' })
		},
		handleAborted: () => {
			dispatch({ type: 'PLAYBACK_ABORTED' })
		},
		handleNext: () => {
			dispatch({ type: 'PLAY_NEXT' })
		},
		handlePrev: () => {
			dispatch({ type: 'PLAY_PREV' })
		},
		handleCanPlay: () => {
			dispatch({ type: 'CAN_PLAY' })
		},
		handleCanPlayThrough: () => {
			dispatch({ type: 'CAN_PLAY_THROUGH' })
		},
		handleLoadedData: () => {
			dispatch({ type: 'LOADED_DATA' })
		},
		handlePlaying: () => {
			dispatch({ type: 'PLAYBACK_STARTED' })
		},
		handleSeeking: e => {
			dispatch({ type: 'SEEKING', event: e })
		},
		handleSeeked: e => {
			dispatch({ type: 'SEEKED', event: e })
		},
		handleJumpBackward: () => {
			dispatch({ type: 'JUMP_BACKWARD' })
		},
		handleJumpForward: () => {
			dispatch({ type: 'JUMP_FORWARD' })
		},
		handleChangeCurrentTimeError: () => {
			console.error('handleChangeCurrentTimeError')
		},
	}
	return (
		<>
			<div className={cn(className, viewState === 'HIDDEN' ? 'hidden ' : '' + 'w-full bg-accent')}>
				{isLoading ||
					(isSeeking && (
						<div className="absolute z-[100] w-full bg-[rgb(255,255,255)]/75">
							<div className="flex h-full w-full items-center justify-center">
								<InlineIcon className="size-16 animate-spin text-primary" icon={'mdi:loading'} />
							</div>
							<div className="text-xs">{`Loading...`}</div>
						</div>
					))}
				<div className="flex flex-col">
					<div className="flex">
						<div className="grow text-left">
							<NavLink to={`/tracks/${currentTrack?.id}`}>
								<CardTitle className="flex flex-nowrap items-center text-2xl sm:text-sm">
									{currentTrack?.title}
								</CardTitle>
								<div className="text-xs">{currentTrack?.versions[0]?.title}</div>
							</NavLink>
						</div>
						<PlayButton className={viewSize !== 'SMALL' ? 'hidden' : ''} size="lg" />
						<PlayerViewStateToggleButton />
						<PlayerCloseButton />
					</div>
				</div>
				<AudioPlayer
					preload="auto"
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
					onSeeking={playerController.handleSeeking}
					onSeeked={playerController.handleSeeked}
					onClickNext={playerController.handleNext}
					onClickPrevious={playerController.handlePrev}
					onChangeCurrentTimeError={playerController.handleChangeCurrentTimeError}
					showDownloadProgress={true}
					showFilledProgress={true}
					hasDefaultKeyBindings={true}
					showJumpControls={false}
					showFilledVolume={true}
					showSkipControls={true}
					src={currentTrack ? getLatestVersionUrl(currentTrack) : ''}
					ref={playerRef}
					autoPlayAfterSrcChange={false}
					autoPlay={false}
					customAdditionalControls={[]}
					customVolumeControls={[]}
					customProgressBarSection={[<WaveFormWrapper key="wf" />]}
					customControlsSection={[
						<div
							key="row-controls"
							className={cn(viewSize === 'SMALL' ? 'hidden' : 'flex', 'grow items-center justify-center')}
						>
							<Button variant="playbutton" onClick={playerController.handlePrev}>
								<InlineIcon className="h-full w-full" icon={'mdi-skip-previous'} />
							</Button>
							<Button variant="playbutton" onClick={playerController.handleJumpBackward}>
								<InlineIcon className="h-full w-full" icon={'mdi-rewind'} />
							</Button>
							<PlayButton size="lg" />
							<Button variant="playbutton" onClick={playerController.handleJumpForward}>
								<InlineIcon className="h-full w-full" icon={'mdi-fast-forward'} />
							</Button>
							<Button variant="playbutton" onClick={playerController.handleNext}>
								<InlineIcon className="h-full w-full" icon={'mdi-skip-next'} />
							</Button>
						</div>,
					]}
				/>
			</div>
		</>
	)
}
