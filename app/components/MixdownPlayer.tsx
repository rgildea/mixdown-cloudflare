import { getCurrentTrack, usePlayerContext, usePlayerDispatchContext } from '#app/contexts/PlayerContext'
import '#app/styles/player.css'
import { cn } from '#app/utils/misc'
import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { NavLink } from '@remix-run/react'
import { useEffect, useRef, useState } from 'react'
import AudioPlayer from 'react-h5-audio-player'
import WaveForm from './WaveForm'
import { Button } from './ui/button'
import { CardTitle } from './ui/card'

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

export default function MixdownPlayer({ className = '' }: MixdownPlayerProps) {
	const [viewState, setViewState] = useState<PlayerVisualState>('LARGE')
	const context = usePlayerContext()
	const dispatch = usePlayerDispatchContext()
	const playerRef = useRef<AudioPlayer>(null)
	const audioElementRef = playerRef.current?.audio
	const currentTrack = getCurrentTrack(context)
	const currentTrackUrl = currentTrack ? getLatestVersionUrl(currentTrack) : ''

	useEffect(() => {
		if (!context?.player?.current || context?.player?.current !== playerRef.current) {
			dispatch({ type: 'SET_PLAYER', playerRef: playerRef })
		}
		return () => {}
	}, [context, dispatch, playerRef])

	const handleViewToggleClicked = () => {
		console.log('handleViewToggleClicked', viewState)
		setViewState(viewState === 'LARGE' ? 'SMALL' : 'LARGE')
	}

	const handleCloseButtonClicked = () => {
		setViewState('HIDDEN')
	}

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

	const hidden = viewState === 'HIDDEN'
	// console.log('MixdownPlayer', { playlist, viewState, hidden, currentTrack, currentTrackUrl })
	return (
		<>
			<div className={cn(className, hidden ? 'invisible ' : '' + 'w-full bg-accent p-5')}>
				<div className="flex flex-col ">
					<div className="flex">
						<div className="grow text-left">
							<>
								<NavLink className="col-span-1" to={`/tracks/${currentTrack?.id}`}>
									<CardTitle className="flex flex-nowrap items-center text-2xl sm:text-sm">
										{currentTrack?.title}
										{context?.player?.current?.isPlaying() ? '🔊' : '🔇'}
									</CardTitle>
								</NavLink>
								<div className="text-xs">{currentTrackUrl}</div>
							</>
						</div>

						<Button onClick={handleViewToggleClicked} variant="ghost" size="icon">
							<InlineIcon
								className="size-8 sm:size-6"
								icon={`mdi:${viewState === 'LARGE' ? 'chevron-down' : 'chevron-up'}`}
							/>
						</Button>

						<Button onClick={handleCloseButtonClicked} variant={'ghost'} size="icon">
							<InlineIcon className="size-8 sm:size-6" icon="mdi:close-circle" />
						</Button>
					</div>
					{viewState === 'LARGE' && (
						<WaveForm
							className="z-30 h-64 w-full"
							audioElementRef={audioElementRef}
							currentSrc={audioElementRef?.current?.currentSrc}
						/>
					)}
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
						customAdditionalControls={[]}
						showDownloadProgress={true}
						showFilledProgress={true}
						showJumpControls={false}
						showFilledVolume={true}
						showSkipControls={false}
						src={currentTrack ? getLatestVersionUrl(currentTrack) : ''}
						ref={playerRef}
						// autoPlayAfterSrcChange={false}
						// autoPlay={false}
						customProgressBarSection={[]}
					/>
				</div>
			</div>
		</>
	)
}
