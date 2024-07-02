import { TrackWithVersions } from '#app/utils/track.server'
import React, { createContext } from 'react'
import AudioPlayer from 'react-h5-audio-player'

const DEFAULT_STATE: PlayerContextType = {
	playlist: [],
	currentTrackIndex: 0,
	isPlaying: false,
}

export type PlayerContextType = {
	playlist: TrackWithVersions[]
	currentTrackIndex?: number
	isPlaying: boolean
	player?: React.RefObject<AudioPlayer> | null
	audioRef?: React.RefObject<HTMLAudioElement> | null
} | null

export const PlayerContext = createContext<PlayerContextType>(DEFAULT_STATE)
export const PlayerDispatchContext = createContext<React.Dispatch<PlayerContextAction>>(() => {})
export type PlayerContextActionType =
	| 'SET_PLAYER'
	| 'SET_PLAYLIST'
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

export interface PlayerContextAction {
	type: PlayerContextActionType
	tracks?: TrackWithVersions[]
	track?: TrackWithVersions | null
	playerRef?: React.RefObject<AudioPlayer> | null
	error?: string
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
		// console.log('getTrackIndex called, but no playlist')
		return -1
	}
	const foundIndex = state.playlist.findIndex(t => t.id === track.id)
	// console.log('getTrackIndex called, returning found index', foundIndex)
	return foundIndex
}

export const PlayerContextReducer = (state: PlayerContextType, action: PlayerContextAction): PlayerContextType => {
	// console.log(`PlayerContextReducer received ${action.type} ACTION`, action)
	// console.log('Current state:', state)
	state = state || DEFAULT_STATE
	const audioElement = state.audioRef?.current
	const playlist = action?.tracks || state?.playlist || []
	const isPlaying = state.player?.current?.isPlaying() || false

	switch (action.type) {
		case 'SET_PLAYLIST':
			return { ...state, playlist, currentTrackIndex: 0 }
		case 'SET_PLAYER':
			return { ...state, player: action.playerRef }
		case 'PLAY_TRACK':
			if (!action?.track) {
				throw new Error('Track missing from PLAY_TRACK action')
			}

			console.log('PLAY_TRACK action received', action.track)

			if (getCurrentTrack(state)?.id === action.track.id) {
				console.log('Track already loaded')
				if (isPlaying) {
					console.log('Pausing track')
					audioElement?.pause()
				} else {
					console.log('Playing track')
					audioElement?.play()
				}
			} else {
				const newTrackIndex = getTrackIndex(state, action.track)
				console.log('Track not loaded. Loading track', action.track, 'new Index: ', newTrackIndex)
				// setting track index will reload player
				state = { ...state, currentTrackIndex: newTrackIndex }
			}

			return state
		case 'PAUSE':
			audioElement?.pause()
			return state
		case 'PLAYBACK_PAUSED':
		default:
			return state
	}
}
