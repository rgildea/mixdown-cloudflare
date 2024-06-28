import WaveForm from '#app/components/WaveForm'
import { PlayerContext, PlayerDispatchContext } from '#app/contexts/PlayerContext'
import '#app/styles/player.css'
import { cn } from '#app/utils/misc'
import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { NavLink } from '@remix-run/react'
import { forwardRef, useContext, useEffect, useRef } from 'react'
import AudioPlayer from 'react-h5-audio-player'
import { Button } from './ui/button'
import { CardTitle } from './ui/card'

const getLatestVersionUrl = (trackId: string, tracks: TrackWithVersions[]) => {
	const found = tracks.find(track => track.id == trackId)
	return found?.versions[0].audioFile?.url
}

export type PlayerState =
	| 'INITIAL_STATE'
	| 'LOADING'
	| 'READY_TO_PLAY'
	| 'PLAYING'
	| 'PAUSED'
	| 'ENDED'
	| 'ABORTED'
	| 'ERROR'

export type PlayerVisualState = 'LARGE' | 'SMALL' | 'HIDDEN'

export interface AudioPlayerProps {
	visualState?: PlayerVisualState
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
	handlePlaying: (e: any) => void
	handlePlay: (e: any) => void
	handlePause: (e: any) => void
	handleNext: (e: any) => void
	handlePrev: (e: any) => void
	handleAborted: (e: any) => void
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
			onPlaying={controller.handlePlaying}
			onPlay={controller.handlePlay}
			onPause={controller.handlePause}
			onAbort={controller.handleAborted}
			onEnded={controller.handleEnded}
			onClickNext={controller.handleNext}
			onClickPrevious={controller.handlePrev}
			customAdditionalControls={[]}
			showDownloadProgress={true}
			showFilledProgress={true}
			showJumpControls={false}
			showFilledVolume={true}
			showSkipControls={false}
			src={url}
			ref={playerRef}
			autoPlayAfterSrcChange={false}
			autoPlay={false}
			customProgressBarSection={[]}
		/>
	)
})

export interface MixdownPlayerProps {
	className?: string
	url?: string
	track?: TrackWithVersions
}

export default function MixdownPlayer({ url, className = '' }: MixdownPlayerProps) {
	const playerState = useContext(PlayerContext)
	const dispatch = useContext(PlayerDispatchContext)
	const player = useRef<AudioPlayer>(null)

	useEffect(() => {
		if (!playerState?.player) {
			dispatch({ type: 'INIT_PLAYER', playerRef: player })
		}
		return () => {
			dispatch({ type: 'DESTROY_PLAYER' })
		}
	}, [dispatch, playerState?.player])

	const { track, visualState } = playerState || {}
	if (!track) return null

	const handleViewToggleClicked = (e: React.MouseEvent<HTMLButtonElement>) => {
		console.log('handleViewToggleClicked', e)
		dispatch({ type: 'TOGGLE_VIEW' })
	}

	const handleCloseButtonClicked = (e: React.MouseEvent<HTMLButtonElement>) => {
		console.log('handleCloseButtonClicked', e)
		dispatch({ type: 'CLOSE_PLAYER' })
	}

	const newSourceUrl = url || getLatestVersionUrl(track.id, [track])
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
			dispatch({ type: 'CAN_PLAY_THROUGH' })
		},
		handleLoadedData: e => {
			console.info('onLoadedData', e)
			dispatch({ type: 'LOADED_DATA' })
		},
		handlePlaying: e => {
			console.info('onPlaying', e)
			if (e?.base) dispatch({ type: 'PLAYBACK_STARTED' })
		},
		handlePlay: e => {
			console.info('onPlay, starting to load and play', e)
		},
		handlePause: e => {
			console.info('onPause', e)
			dispatch({ type: 'PLAYBACK_PAUSED' })
		},
		handleEnded: e => {
			console.info('onEnded', e)
			dispatch({ type: 'PLAYBACK_ENDED' })
		},
		handleAborted: e => {
			console.info('onAborted', e)
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
		<>
			<div className={cn(className, 'w-full bg-accent p-5')}>
				<div className="flex flex-col ">
					<div className="flex">
						<div className="grow text-left">
							<>
								<NavLink className="col-span-1" to={`/tracks/${track?.id}`}>
									<CardTitle className="flex flex-nowrap items-center text-2xl sm:text-sm">{track?.title}</CardTitle>
								</NavLink>
								<div className="text-xs">{newSourceUrl}</div>
							</>
						</div>

						<Button onClick={handleViewToggleClicked} variant="ghost" size="icon">
							<InlineIcon
								className="size-8 sm:size-6"
								icon={`mdi:${visualState === 'LARGE' ? 'chevron-down' : 'chevron-up'}`}
							/>
						</Button>

						<Button onClick={handleCloseButtonClicked} variant={'ghost'} size="icon">
							<InlineIcon className="size-8 sm:size-6" icon="mdi:close-circle" />
						</Button>
					</div>
					{visualState === 'LARGE' && (
						<WaveForm
							className="z-30 h-64 w-full"
							audioElementRef={audioElementRef}
							currentSrc={audioElementRef?.current?.currentSrc}
						/>
					)}

					<InternalPlayerComponent controller={playerController} url={newSourceUrl} ref={player} track={track} />
				</div>
			</div>
		</>
	)
}
