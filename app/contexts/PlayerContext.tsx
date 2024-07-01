import { PlayerVisualState } from '#app/components/MixdownPlayer'
import { TrackWithVersions } from '#app/utils/track.server'
import React, { createContext } from 'react'
import AudioPlayer from 'react-h5-audio-player'

const DEFAULT_STATE: PlayerContextType = {
	playlist: [],
	currentTrackIndex: 0,
	visualState: 'LARGE',
	isPlaying: false,
	getCurrentTrack: () => null,
}

export type PlayerContextType = {
	playlist: TrackWithVersions[]
	currentTrackIndex?: number
	isPlaying: boolean
	getCurrentTrack: () => TrackWithVersions | null

	player?: React.RefObject<AudioPlayer> | null
	audioRef?: React.RefObject<HTMLAudioElement> | null
	visualState?: PlayerVisualState | null
} | null

export const PlayerContext = createContext<PlayerContextType>(DEFAULT_STATE)

export const PlayerDispatchContext = createContext<React.Dispatch<PlayerContextAction>>(() => {})

export type PlayerContextActionType =
	| 'SET_PLAYER'
	| 'SET_PLAYLIST'
	| 'LOAD_TRACK'
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

export interface PlayerContextAction {
	type: PlayerContextActionType
	tracks?: TrackWithVersions[]
	track?: TrackWithVersions | null
	playerRef?: React.RefObject<AudioPlayer> | null
	error?: string
}

export const getCurrentTrack = (state: PlayerContextType): TrackWithVersions | null => {
	if (!state?.playlist) {
		console.log('getCurrentTrack called, but no playlist')
		return null
	}

	if (state?.currentTrackIndex === undefined || state?.currentTrackIndex < 0) {
		console.log('getCurrentTrack called, but no currentTrackIndex')
		return null
	}

	console.log('getCurrentTrack called, returning track at index', state.currentTrackIndex)
	return state.playlist[state.currentTrackIndex]
}

export const getTrackIndex = (state: PlayerContextType, track: TrackWithVersions): number => {
	console.log('getTrackIndex called')
	console.log('state.playlist', state?.playlist)
	console.log('track', track)

	if (!state?.playlist) {
		console.log('getTrackIndex called, but no playlist')
		return -1
	}
	const foundIndex = state.playlist.findIndex(t => t.id === track.id)
	console.log('getTrackIndex called, returning index', foundIndex)
	return foundIndex
}

export const PlayerContextReducer = (state: PlayerContextType, action: PlayerContextAction): PlayerContextType => {
	console.log(`PlayerContextReducer received ${action.type} ACTION`, action)
	console.log('Current state:', state)
	state = state || DEFAULT_STATE
	const player = state.player?.current?.audio.current
	const playlist = action?.tracks || state?.playlist || []
	const isPlaying = state.player?.current?.isPlaying() || false

	if (!state.player) {
		console.log('No player ref found')
	} else {
		console.log('YES Player ref found')
	}

	switch (action.type) {
		case 'SET_PLAYLIST':
			console.log('Setting playlist', playlist)
			return { ...state, playlist, currentTrackIndex: 0 }

		// Important: we're setting track, audio ref, and player ref here by returning them
		// in the state.
		// This re-renders the Waveform component, re-creating the WaveSurfer instance
		// with the updated audio element.
		case 'SET_PLAYER':
			console.log('SET_PLAYER called')
			return { ...state, player: action.playerRef }
		case 'PLAY_TRACK':
			console.log('PLAY_TRACK called')
			if (!action?.track) {
				throw new Error('Track missing from PLAY_TRACK action')
			}

			if (getCurrentTrack(state)?.id === action.track.id) {
				console.log('Track already loaded')
				if (isPlaying) {
					console.log('Pausing track')
					player?.pause()
				} else {
					console.log('Playing track')
					player.play()
				}
			} else {
				const newTrackIndex = getTrackIndex(state, action.track)
				console.log('Loading track', action.track, 'new Index: ', newTrackIndex)
				// setting track index will reload player
				state = { ...state, currentTrackIndex: newTrackIndex }
			}

			return state
		case 'PAUSE':
			console.log('PAUSE called')
			player?.pause()
			return state
		default:
			return state
	}
}
