import { TrackWithVersions } from '#app/utils/track.server'
import React, { createContext, useReducer } from 'react'

export type PlayerContextType = {
	track: TrackWithVersions
} | null

export const PlayerContext = createContext<PlayerContextType>(null)
export const PlayerDispatchContext = createContext<React.Dispatch<PlayerContextAction>>(() => {})
export type PlayerContextActionType = 'PAUSE' | 'PLAY_TRACK'

export interface PlayerContextAction {
	type: PlayerContextActionType
	track?: TrackWithVersions
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
	console.log('PlayerContextReducer received action:', action)
	switch (action.type) {
		case 'PLAY_TRACK':
			if (!action.track) {
				throw new Error('TrackId missing from PLAY_TRACK action')
			}
			return { ...state, track: action.track }
		case 'PAUSE':
			return state
		default:
			return state
	}
}
