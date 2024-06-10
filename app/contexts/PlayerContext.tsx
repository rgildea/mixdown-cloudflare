import { PlayerStates } from '#app/components/MixdownPlayer'
import { TrackWithVersions } from '#app/utils/track.server'
import React, { createContext, useReducer } from 'react'
import AudioPlayer from 'react-h5-audio-player'

export type PlayerContextType = {
	track?: TrackWithVersions
	player?: React.RefObject<AudioPlayer> | null
	playerState?: PlayerStates
	audioRef?: React.RefObject<HTMLAudioElement> | null
} | null

export const PlayerContext = createContext<PlayerContextType>({ playerState: 'INITIAL_STATE' })
export const PlayerDispatchContext = createContext<React.Dispatch<PlayerContextAction>>(() => {})
export type PlayerContextActionType =
	| 'INIT_PLAYER'
	| 'DESTROY_PLAYER'
	| 'LOAD_START'
	| 'CAN_PLAY'
	| 'PLAYBACK_STARTED'
	| 'PLAYBACK_PAUSED'
	| 'PLAYBACK_ERROR'
	| 'PLAYBACK_ENDED'
	| 'PLAYBACK_ABORTED'
	| 'PLAY_TRACK'
	| 'RESTART_TRACK'
	| 'PAUSE'
	| 'CLOSE_PLAYER'

export interface PlayerContextAction {
	type: PlayerContextActionType
	track?: TrackWithVersions | null
	playerRef?: React.RefObject<AudioPlayer> | null
	error?: string
}

export const PlayerContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [playerState, dispatch] = useReducer<
		(state: PlayerContextType, action: PlayerContextAction) => PlayerContextType
	>(PlayerContextReducer, null)

	return (
		<PlayerContext.Provider value={playerState}>
			<PlayerDispatchContext.Provider value={dispatch}>{children}</PlayerDispatchContext.Provider>
		</PlayerContext.Provider>
	)
}

export const PlayerContextReducer = (state: PlayerContextType, action: PlayerContextAction): PlayerContextType => {
	console.log(`PlayerContextReducer received ${action.type} ACTION`, action)
	const player = state?.player?.current?.audio.current

	switch (action.type) {
		case 'INIT_PLAYER':
			return {
				...state,
				player: action.playerRef,
				audioRef: action.playerRef?.current?.audio,
				playerState: 'INITIAL_STATE',
			}
		case 'DESTROY_PLAYER':
			return { ...state, playerState: 'INITIAL_STATE' }
		case 'LOAD_START':
			if (!action.track) {
				throw new Error('TrackId missing from LOAD_START action')
			}
			return { ...state, track: action.track, playerState: 'LOADING', audioRef: action.playerRef?.current?.audio }
		case 'CAN_PLAY':
			console.log('CAN_PLAY called from state ', state?.playerState)

			if (state?.playerState !== 'LOADING') {
				return state
			}
			return { ...state, playerState: 'READY_TO_PLAY' }
		case 'PLAYBACK_STARTED':
			return { ...state, playerState: 'PLAYING' }
		case 'PLAYBACK_PAUSED':
			return { ...state, playerState: 'PAUSED' }
		case 'PLAYBACK_ERROR':
			return state
		// return { ...state, playerState: 'ERROR' }
		case 'PLAYBACK_ENDED':
			return state
		// return { ...state, playerState: 'ENDED' }
		case 'PLAYBACK_ABORTED':
			// return { ...state, playerState: 'ABORTED' }
			return state
		case 'PLAY_TRACK':
			if (!action.track) {
				throw new Error('Track missing from PLAY_TRACK action')
			}
			player?.play()
			return { ...state, track: action.track }
		case 'RESTART_TRACK':
			if (!state?.track) {
				throw new Error('Track missing from RESTART_TRACK action')
			}
			player?.load()
			player?.play()
			return state

		case 'PAUSE':
			if (!state?.track) {
				throw new Error('Track missing from PAUSE action')
			}
			console.log('PAUSE called')
			console.log('Player', player)
			player?.pause()
			return state
		case 'CLOSE_PLAYER':
			player?.pause()
			// unsetting  the track will cause the player to be hidden
			return { ...state, track: undefined, playerState: 'INITIAL_STATE' }

		default:
			return state
	}
}
