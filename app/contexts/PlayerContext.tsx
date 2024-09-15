/* eslint-disable no-fallthrough */
import { TrackWithVersions } from '#app/utils/track.server'
import React, { createContext, useContext } from 'react'
import AudioPlayer from 'react-h5-audio-player'

const DEFAULT_STATE: PlayerContextData = {
	playlist: [],
	currentTrackIndex: undefined,
	isPlaying: false,
	isLoading: false,
	isSeeking: false,
	viewState: 'HIDDEN',
	viewSize: 'LARGE',
}

export type PlayerContextData = {
	playlist: TrackWithVersions[]
	currentTrackIndex?: number
	currentTrackVersionId?: string
	lastPosition?: number
	isPlaying: boolean
	isLoading: boolean
	isSeeking: boolean
	player?: React.RefObject<AudioPlayer> | null
	viewState?: 'VISIBLE' | 'HIDDEN' | undefined
	viewSize?: 'SMALL' | 'LARGE'
} | null

export const PlayerContext = createContext<PlayerContextData>(DEFAULT_STATE)
export const usePlayerContext = () => useContext(PlayerContext)
export const PlayerDispatchContext = createContext<React.Dispatch<PlayerContextAction>>(() => {})
export const usePlayerDispatchContext = () => useContext(PlayerDispatchContext)

export type PlayerContextActionType =
	| 'SET_PLAYER'
	| 'SET_PLAYLIST'
	| 'SET_CURRENT_TRACK'
	| 'SET_SELECTED_TRACK_VERSION'
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
	versionId?: string
	playerRef?: React.RefObject<AudioPlayer> | null
	error?: string
	viewSize?: 'SMALL' | 'LARGE'
	viewState?: 'VISIBLE' | 'HIDDEN'
	time?: number
	event?: React.SyntheticEvent | null
}

export const getCurrentTrack = (state: PlayerContextData): TrackWithVersions | null => {
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

export const getTrackIndex = (state: PlayerContextData, track: TrackWithVersions): number => {
	if (!state?.playlist) {
		return -1
	}
	const foundIndex = state.playlist.findIndex(t => t.id === track.id)
	return foundIndex
}

export const getCurrentTrackVersionId = (state: PlayerContextData): string | undefined => {
	if (!state?.playlist) {
		return undefined
	}

	if (state?.currentTrackIndex === undefined || state?.currentTrackIndex < 0) {
		return undefined
	}

	if (state?.currentTrackIndex >= state.playlist.length) {
		return undefined
	}

	return state.playlist[state.currentTrackIndex].activeTrackVersion?.id
}

export const PlayerContextReducer = (state: PlayerContextData, action: PlayerContextAction): PlayerContextData => {
	state = state || DEFAULT_STATE
	const currentTrackIndex = state.currentTrackIndex || 0
	const audioElement = state.player?.current?.audio.current
	const playlist = action?.tracks || state?.playlist || []
	const player = state.player?.current
	const track = action.track || (getCurrentTrack(state) as TrackWithVersions)
	const trackIndex = action.track ? getTrackIndex(state, action.track) : -1
	const versionToPlay = action.track ? getVersionToPlay(track, action.versionId ?? undefined) : undefined
	const newTime = Math.min(action.time || 0, audioElement?.duration || 0) ?? 0
	// console.log('PlayerContextReducer:', action.type, action)
	switch (action.type) {
		case 'SET_PLAYLIST':
			return { ...state, playlist, currentTrackIndex: 0, currentTrackVersionId: versionToPlay, isLoading: true }
		case 'SET_CURRENT_TRACK':
			return {
				...state,
				playlist: [track],
				currentTrackIndex: 0,
				currentTrackVersionId: versionToPlay,
				isLoading: true,
			}
		case 'SET_SELECTED_TRACK_VERSION':
			if (!action.track) return state
			if (trackIndex === -1) {
				console.info('Track not found in playlist')
				return state
			}

			return { ...state, lastPosition: audioElement?.currentTime, currentTrackVersionId: versionToPlay }
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
			if (!player) throw new Error('Player missing, cannot pause track !')
			player.togglePlay(action.event)
			return { ...state, isPlaying: false }
		case 'PLAY_TRACK':
			if (!state.player) throw new Error('Player missing, cannot play track !')
			if (!action?.track) throw new Error('Track missing from PLAY_TRACK action')
			if (!action?.event) throw new Error('Event missing from PLAY_TRACK action')
			if (getCurrentTrack(state)?.id === action.track.id) {
				console.log('Toggling Play')
				if (getCurrentTrackVersionId(state) === versionToPlay) {
					player?.togglePlay(action.event)
				} else if (audioElement) {
					console.log('Playing new version:', versionToPlay)
					console.log('Current Source in player:', audioElement?.currentSrc)
					console.log('Current Time in player:', audioElement?.currentTime)
					console.log('Setting  Current Time to:', newTime)
					audioElement.currentTime = Math.min(action.time || 0, audioElement?.duration || 0) ?? 0
				} else {
					console.warn('No audio element to play track:', action.track)
				}
			} else {
				const newTrackIndex = getTrackIndex(state, action.track)
				console.log('New Track Index:', newTrackIndex)

				if (newTrackIndex === -1) {
					console.info('Track not found in playlist')
					// reset playlist
					state = {
						...state,
						viewState: 'VISIBLE',
						playlist: [action.track],
						currentTrackIndex: 0,
						currentTrackVersionId: versionToPlay,
					}
					console.log('Resetting Playlist and Playing new track:', action.track)
				} else {
					console.log('Playing track:', newTrackIndex, action.track)
					state = {
						...state,
						viewState: 'VISIBLE',
						currentTrackIndex: newTrackIndex,
						currentTrackVersionId: versionToPlay,
					}
				}
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				audioElement?.addEventListener(
					'canplay',
					() => {
						console.log('Playing new track:', action.track)

						audioElement?.play()
						// audioElement?.removeEventListener('canplay', () => {})
					},
					{ once: true },
				)
			}
			return state
		case 'PLAY_PREV':
			audioElement?.addEventListener(
				'canplay',
				() => {
					const promise = audioElement?.play()
					if (promise) {
						promise.then(() => console.log('Playing Previous Track')).catch(err => console.error(err))
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
			console.log('Current Source in player:', state.player?.current?.audio.current?.currentSrc)
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

function getVersionToPlay(track?: TrackWithVersions, versionId?: string) {
	if (!track) {
		console.warn('No track provided, cannot play version:', versionId)
		return undefined
	}
	if (!versionId) {
		console.log('No versionId provided, playing active version:', track.activeTrackVersion?.id)
		return track.activeTrackVersion?.id
	}
	return track.trackVersions.find(v => v.id === versionId)?.id ?? track.activeTrackVersion?.id
}
