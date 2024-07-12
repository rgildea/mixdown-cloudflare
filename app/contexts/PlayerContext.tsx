import { TrackWithVersions } from '#app/utils/track.server'
import React, { createContext, useContext } from 'react'
import AudioPlayer from 'react-h5-audio-player'

const DEFAULT_STATE: PlayerContextType = {
	playlist: [],
	currentTrackIndex: 0,
	isPlaying: false,
	isLoading: true,
	isSeeking: false,
	viewState: 'VISIBLE',
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
	const isPlaying = state.player?.current?.isPlaying() || false

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
			console.log('LOAD_START action received')
			console.log('Current track:', getCurrentTrack(state))
			console.log('Current State', state)
			return { ...state, isLoading: true }
		case 'PLAY_TRACK':
			if (!action?.track) throw new Error('Track missing from PLAY_TRACK action')
			if (getCurrentTrack(state)?.id === action.track.id) {
				if (isPlaying) {
					audioElement?.pause()
				} else {
					audioElement?.play()
					// state.player?.current?.playAudioPromise()
				}
			} else {
				const newTrackIndex = getTrackIndex(state, action.track)
				audioElement?.addEventListener('canplay', () => {
					audioElement?.play()
					audioElement?.removeEventListener('canplay', () => {})
				})
				state = { ...state, currentTrackIndex: newTrackIndex }
			}
			return state
		case 'PAUSE':
			audioElement?.pause()
			return state
		case 'PLAY_PREV':
			audioElement?.addEventListener('canplay', () => {
				audioElement?.play()
				audioElement?.removeEventListener('canplay', () => {})
			})
			return { ...state, currentTrackIndex: (currentTrackIndex - 1) % state.playlist.length }
		case 'PLAY_NEXT':
			audioElement?.addEventListener('canplay', () => {
				audioElement?.play()
				audioElement?.removeEventListener('canplay', () => {})
			})
			return { ...state, currentTrackIndex: (currentTrackIndex + 1) % state.playlist.length }
		case 'SEEK':
			if (audioElement && action.time) {
				console.log('Seeking to', action.time)
				audioElement.currentTime = action.time
			}
			return { ...state, isSeeking: true }
		case 'SEEKING':
			console.log('SEEKING action received')
			return { ...state, isSeeking: true }
		case 'SEEKED':
			console.log('SEEKED action received')
			return { ...state, isSeeking: false }
		case 'PLAYBACK_STARTED':
			console.log('PLAYBACK_STARTED action received')
			return { ...state, isPlaying: true, viewState: 'VISIBLE' }
		case 'PLAYBACK_ERROR':
			console.warn('Playback error:', action.error)
			return state
		case 'PLAYBACK_PAUSED':
			console.log('PLAYBACK_PAUSED action received')
			return { ...state, isPlaying: false }
		case 'PLAYBACK_ENDED':
			console.log('PLAYBACK_ENDED action received')
			return { ...state, isPlaying }
		case 'PLAYBACK_ABORTED':
			console.log('PLAYBACK_ABORTED action received')
			return { ...state, isPlaying: false }
		case 'CAN_PLAY':
			console.log('CAN_PLAY action received')
			return { ...state, isLoading: false }
		case 'CAN_PLAY_THROUGH':
			console.log('CAN_PLAY_THROUGH action received')
			return { ...state, isLoading: false }
		case 'LOADED_DATA':
			console.log('LOADED_DATA action received')
			console.log(action)
			return { ...state, isLoading: false }
		default:
			return state
	}
}
