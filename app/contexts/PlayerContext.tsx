import { PlayerState, PlayerVisualState } from '#app/components/MixdownPlayer'
import { TrackWithVersions } from '#app/utils/track.server'
import React, { createContext } from 'react'
import AudioPlayer from 'react-h5-audio-player'

export type PlayerContextType = {
	track?: TrackWithVersions | null
	player?: React.RefObject<AudioPlayer> | null
	playerState?: PlayerState | null
	audioRef?: React.RefObject<HTMLAudioElement> | null
	visualState?: PlayerVisualState | null
} | null

export const PlayerContext = createContext<PlayerContextType>({ playerState: 'INITIAL_STATE', visualState: 'HIDDEN' })
export const PlayerDispatchContext = createContext<React.Dispatch<PlayerContextAction>>(() => {})
export type PlayerContextActionType =
	| 'INIT_PLAYER'
	| 'DESTROY_PLAYER'
	| 'LOAD_START'
	| 'LOADED_DATA'
	| 'CAN_PLAY'
	| 'CAN_PLAY_THROUGH'
	| 'PLAYBACK_STARTED'
	| 'PLAYBACK_PAUSED'
	| 'PLAYBACK_ERROR'
	| 'PLAYBACK_ENDED'
	| 'PLAYBACK_ABORTED'
	| 'PLAY_TRACK'
	| 'RESTART_TRACK'
	| 'PAUSE'
	| 'CLOSE_PLAYER'
	| 'COLLAPSE_PLAYER'
	| 'EXPAND_PLAYER'

export interface PlayerContextAction {
	type: PlayerContextActionType
	track?: TrackWithVersions | null
	playerRef?: React.RefObject<AudioPlayer> | null
	error?: string
}

export const PlayerContextReducer = (state: PlayerContextType, action: PlayerContextAction): PlayerContextType => {
	console.log(`PlayerContextReducer received ${action.type} ACTION`, action)
	const player = state?.player?.current?.audio.current

	switch (action.type) {
		case 'INIT_PLAYER':
			if (player) {
				console.log('Player already exists')
				return state
			}
			return {
				...state,
				player: action.playerRef,
				audioRef: action.playerRef?.current?.audio,
				playerState: 'INITIAL_STATE',
				visualState: 'LARGE',
			}
		case 'DESTROY_PLAYER':
			// no-op
			return state

		case 'LOAD_START':
			if (!action.track) {
				console.log('TrackId missing from LOAD_START action')
				return state
			}
			return { ...state, track: action.track, playerState: 'LOADING', audioRef: action.playerRef?.current?.audio }

		case 'CAN_PLAY':
			if (state?.playerState !== 'LOADING') {
				return state
			}
			player?.play()
			return { ...state, playerState: 'READY_TO_PLAY' }
		case 'CAN_PLAY_THROUGH':
			console.log('CAN_PLAY_THROUGH called')

			if (state?.playerState !== 'LOADING') {
				return state
			}
			return { ...state, playerState: 'READY_TO_PLAY' }

		case 'LOADED_DATA':
			console.log('LOADED_DATA event called')
			return state
		case 'PLAYBACK_STARTED':
			return { ...state, playerState: 'PLAYING' }
		case 'PLAYBACK_PAUSED':
			return { ...state, playerState: 'PAUSED' }
		case 'PLAYBACK_ERROR':
			return { ...state, playerState: 'ERROR' }
		case 'PLAYBACK_ENDED':
			return { ...state, playerState: 'ENDED' }
		case 'PLAYBACK_ABORTED':
			return { ...state, playerState: 'ABORTED' }

		// Important: we're setting track, audio ref, and player ref here by returning them
		// in the state.
		// This re-renders the Waveform component, re-creating the WaveSurfer instance
		// with the updated audio element.
		case 'PLAY_TRACK':
			if (!action.track) {
				throw new Error('Track missing from PLAY_TRACK action')
			}

			return {
				...state,
				player: action.playerRef,
				track: action.track,
				audioRef: action.playerRef?.current?.audio,
				playerState: 'LOADING',
			}

		case 'RESTART_TRACK':
			if (!state?.track) {
				throw new Error('Track missing from RESTART_TRACK action')
			}

			return {
				...state,
				player: action.playerRef,
				track: action.track,
				audioRef: action.playerRef?.current?.audio,
				playerState: 'LOADING',
			}

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
			// unsetting the track will cause the player to be hidden
			return { ...state, track: undefined, visualState: 'HIDDEN', playerState: 'INITIAL_STATE' }
		case 'COLLAPSE_PLAYER':
			return { ...state, visualState: 'SMALL' }
		case 'EXPAND_PLAYER':
			if (!state?.track) {
				console.log('No track to expand player with')
				return state
			}
			return { ...state, visualState: 'LARGE' }

		default:
			return state
	}
}
