/* eslint-disable no-fallthrough */
import { TrackWithVersions } from '#app/utils/track.server'
import React, { createContext, useContext } from 'react'
import AudioPlayer from 'react-h5-audio-player'

const DEFAULT_STATE: PlayerContextType = {
	playlist: [],
	currentTrackIndex: undefined,
	isPlaying: false,
	isLoading: false,
	isSeeking: false,
	viewState: 'HIDDEN',
	viewSize: 'LARGE',
}

export type PlayerContextType = {
	playlist: TrackWithVersions[]
	currentTrackIndex?: number
	isPlaying: boolean
	isLoading: boolean
	isSeeking: boolean
	player?: React.RefObject<AudioPlayer> | null
	viewState?: 'VISIBLE' | 'HIDDEN'
	viewSize?: 'SMALL' | 'LARGE'
} | null

export const PlayerContext = createContext<PlayerContextType>(DEFAULT_STATE)
export const usePlayerContext = () => useContext(PlayerContext)
export const PlayerDispatchContext = createContext<React.Dispatch<PlayerContextAction>>(() => {})
export const usePlayerDispatchContext = () => useContext(PlayerDispatchContext)

export type PlayerContextActionType =
	| 'SET_PLAYER'
	| 'SET_PLAYLIST'
	| 'SET_VIEW_STATE'
	| 'TOGGLE_VIEW_SIZE'
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
	| 'PAUSE'
	| 'JUMP_BACKWARD'
	| 'JUMP_FORWARD'
	| 'PLAY_NEXT'
	| 'PLAY_PREV'
	| 'SEEK'
	| 'SEEKING'
	| 'SEEKED'

export interface PlayerContextAction {
	type: PlayerContextActionType
	tracks?: TrackWithVersions[]
	track?: TrackWithVersions | null
	playerRef?: React.RefObject<AudioPlayer> | null
	error?: string
	viewSize?: 'SMALL' | 'LARGE'
	viewState?: 'VISIBLE' | 'HIDDEN'
	time?: number
	event?: React.SyntheticEvent | null
}

export const getCurrentTrack = (state: PlayerContextType): TrackWithVersions | null => {
	if (!state?.playlist) {
		return null
	}

	if (state?.currentTrackIndex === undefined || state?.currentTrackIndex < 0) {
		return null
	}

	if (state?.currentTrackIndex >= state.playlist.length) {
		return null
	}

	return state.playlist[state.currentTrackIndex]
}

export const getTrackIndex = (state: PlayerContextType, track: TrackWithVersions): number => {
	if (!state?.playlist) {
		return -1
	}
	const foundIndex = state.playlist.findIndex(t => t.id === track.id)
	return foundIndex
}

export const PlayerContextReducer = (state: PlayerContextType, action: PlayerContextAction): PlayerContextType => {
	state = state || DEFAULT_STATE
	const currentTrackIndex = state.currentTrackIndex || 0
	const audioElement = state.player?.current?.audio.current
	const playlist = action?.tracks || state?.playlist || []
	const player = state.player?.current

	console.log('PlayerContextReducer:', action.type, action)
	switch (action.type) {
		case 'SET_PLAYLIST':
			return { ...state, playlist, currentTrackIndex: 0, isLoading: true }
		case 'SET_PLAYER':
			return { ...state, player: action.playerRef }
		case 'SET_VIEW_STATE':
			return { ...state, viewState: action.viewState }
		case 'TOGGLE_VIEW_SIZE':
			return { ...state, viewSize: state.viewSize === 'LARGE' ? 'SMALL' : 'LARGE' }
		case 'LOAD_START':
			return { ...state, isLoading: true }
		case 'PAUSE':
			if (!action?.event) throw new Error('Event missing from PAUSE action')
			player?.togglePlay(action?.event)
			return state
		case 'PLAY_TRACK':
			if (!action?.track) throw new Error('Track missing from PLAY_TRACK action')
			if (!action?.event) throw new Error('Event missing from PLAY_TRACK action')

			if (getCurrentTrack(state)?.id === action.track.id) {
				player?.togglePlay(action.event)
			} else {
				const newTrackIndex = getTrackIndex(state, action.track)
				if (newTrackIndex === -1) {
					console.info('Track not found in playlist')
					// reset playlist
					state = { ...state, playlist: [action.track], currentTrackIndex: 0 }

					return state
				}
				state = { ...state, currentTrackIndex: newTrackIndex }
			}
			return state
		case 'PLAY_PREV':
			audioElement?.addEventListener(
				'canplay',
				() => {
					const promise = audioElement?.play()
					if (promise) {
						promise.catch(err => console.error(err))
					}
				},
				{ once: true },
			)
			return { ...state, currentTrackIndex: (currentTrackIndex - 1) % state.playlist.length }
		case 'PLAY_NEXT':
			audioElement?.addEventListener(
				'canplay',
				() => {
					audioElement?.play()
					audioElement?.removeEventListener('canplay', () => {})
				},
				{ once: true },
			)
			return { ...state, currentTrackIndex: (currentTrackIndex + 1) % state.playlist.length }
		case 'SEEK':
			if (audioElement && action.time) {
				audioElement.currentTime = action.time
			}
			return { ...state, isSeeking: true }
		case 'SEEKING':
			return { ...state, isSeeking: true }
		case 'SEEKED':
			return { ...state, isSeeking: false }
		case 'PLAYBACK_STARTED':
			return { ...state, isPlaying: true, viewState: 'VISIBLE' }
		case 'PLAYBACK_ERROR':
			console.warn('Playback error:', action.error)
			return state
		case 'PLAYBACK_PAUSED':
			return { ...state, isPlaying: false }
		case 'PLAYBACK_ENDED':
			return { ...state, isPlaying: false }
		case 'PLAYBACK_ABORTED':
			return { ...state, isPlaying: false }
		case 'CAN_PLAY':
			return { ...state, isLoading: false }
		case 'CAN_PLAY_THROUGH':
			return { ...state, isLoading: false }
		case 'LOADED_DATA':
			return { ...state, isLoading: true }
		case 'JUMP_BACKWARD':
			if (!audioElement) return state
			audioElement.currentTime = Math.max(audioElement.currentTime - 10, 0)

			return state
		case 'JUMP_FORWARD':
			if (!audioElement) return state
			audioElement.currentTime = Number(Math.min(audioElement.currentTime + 10, audioElement.duration))
			return state
		default:
			return state
	}
}
