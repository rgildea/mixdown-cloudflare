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

const getAudioUrlForVersion = (track: TrackWithVersions, versionId: string) => {
	const versionToPlay = versionId ? track.trackVersions.find(v => v.id === versionId) : track?.activeTrackVersion
	if (!versionToPlay) {
		console.error('No version to play')
		return undefined
	}
	return versionToPlay?.audioFile?.url
}

export interface PlayerController {
	handleAborted?: (e: any) => void
	handleCanPlay?: (e: any) => void
	handleCanPlayThrough?: (e: any) => void
	handleChangeCurrentTimeError?: () => void
	handleEnded?: (e: any) => void
	handleJumpBackward?: (e: any) => void
	handleJumpForward?: (e: any) => void
	handleListen?: (e: any) => void
	handleLoadedData?: (e: any) => void
	handleLoadStart?: (e: any) => void
	handleNext?: (e: any) => void
	handlePause?: (e: any) => void
	handlePlay?: (e: any) => void
	handlePlayError?: (e: any) => void
	handlePlaying?: (e: any) => void
	handlePrev?: (e: any) => void
	handleSeeked?: (e: any) => void
	handleSeeking?: (e: any) => void
}

export interface MixdownPlayerProps {
	className?: string
	url?: string
	embed?: boolean
	track?: TrackWithVersions
	currentTrackVersionId?: string
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
			className={cn(viewState !== 'LARGE' ? 'hidden' : '', 'z-30 h-min w-full')}
			audioElementRef={audioElementRef}
			currentSrc={audioElementRef?.current?.currentSrc}
		/>
	)
}
const MiniPlayer = () => {
	const playerState = usePlayerContext()
	const currentTrack = getCurrentTrack(playerState)
	const viewSize = playerState?.viewSize

	return (
		<div className="flex flex-col">
			<div className="flex">
				<div className="grow text-left">
					<NavLink to={`/tracks/${currentTrack?.id}`}>
						<CardTitle className="flex flex-nowrap items-center text-2xl sm:text-sm">{currentTrack?.title}</CardTitle>
						<div className="text-xs">{currentTrack?.activeTrackVersion?.title}</div>
					</NavLink>
				</div>
				<PlayButton className={viewSize !== 'SMALL' ? 'hidden' : ''} size="lg" />
				<PlayerViewStateToggleButton />
				<PlayerCloseButton />
			</div>
		</div>
	)
}

export default function MixdownPlayer({
	embed = false,
	className = '',
	track,
	currentTrackVersionId,
}: MixdownPlayerProps) {
	const context = usePlayerContext()
	const { isLoading = true, isSeeking = true, viewSize = 'LARGE' } = context || {}
	const dispatch = usePlayerDispatchContext()
	const playerRef = useRef<AudioPlayer>(null)
	const currentTrack = track ?? getCurrentTrack(context)
	const loadCounter = useRef(0)

	useEffect(() => {
		if (!context?.player?.current) {
			dispatch({ type: 'SET_PLAYER', playerRef: playerRef })
		} else if (context?.player?.current !== playerRef.current) {
			dispatch({ type: 'SET_PLAYER', playerRef: playerRef })
		}
		loadCounter.current++
		console.debug('Player loadCounter:', loadCounter.current)
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
		handleListen: () => {
			dispatch({ type: 'LISTEN' })
		},
	}

	if (!currentTrack) return <></>
	if (!currentTrack.activeTrackVersion) return <></>
	// const currentTrackVersionToPlay = context?.currentTrackVersionId || currentTrack.activeTrackVersion.id
	const currentTrackVersionToPlay = currentTrackVersionId || currentTrack.activeTrackVersion.id

	const controls = embed
		? []
		: [
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
			]

	return (
		<>
			<div className={cn(className, 'flex w-full flex-col bg-accent', embed ? 'rounded' : '')}>
				{isLoading ||
					(isSeeking && (
						<div className="absolute z-[100] w-full bg-[rgb(255,255,255)]/75">
							<div className="flex h-full w-full items-center justify-center">
								<InlineIcon className="size-16 animate-spin text-primary" icon={'mdi:loading'} />
							</div>
							<div className="text-xs">{`Loading...`}</div>
						</div>
					))}
				{!embed && <MiniPlayer />}
				<div className="flex items-center">
					{embed && <PlayButton size="xl" track={currentTrack} />}
					<AudioPlayer
						className="grow-1"
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
						onListen={playerController.handleListen}
						onClickNext={playerController.handleNext}
						onClickPrevious={playerController.handlePrev}
						onChangeCurrentTimeError={playerController.handleChangeCurrentTimeError}
						showDownloadProgress={true}
						showFilledProgress={true}
						hasDefaultKeyBindings={true}
						showJumpControls={false}
						showFilledVolume={true}
						showSkipControls={true}
						src={currentTrack ? getAudioUrlForVersion(currentTrack, currentTrackVersionToPlay) : ''}
						ref={playerRef}
						autoPlayAfterSrcChange={false}
						autoPlay={false}
						customAdditionalControls={[]}
						customVolumeControls={[]}
						customProgressBarSection={[<WaveFormWrapper key="wf" />]}
						customControlsSection={controls}
						listenInterval={100}
					/>
				</div>
			</div>
		</>
	)
}
