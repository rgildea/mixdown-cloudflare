import React, { createContext, useReducer } from 'react'

export type PlayerContextType = {
	url?: string
	trackId?: string
} | null

export const PlayerContext = createContext<PlayerContextType>(null)
export const PlayerDispatchContext = createContext<React.Dispatch<PlayerContextAction>>(() => {})
export type PlayerContextActionType = 'PLAY' | 'PAUSE' | 'PLAY_TRACK'

export interface PlayerContextAction {
	type: PlayerContextActionType
	url?: string
	trackId?: string
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
	switch (action.type) {
		case 'PLAY_TRACK':
			if (!action.trackId) {
				throw new Error('TrackId missing from PLAY_TRACK action')
			}
			return { ...state, trackId: action.trackId }
		case 'PLAY':
			if (!action.url) {
				throw new Error('Url missing from PLAY action')
			}
			return { ...state, url: action.url }
		case 'PAUSE':
			return state
		default:
			return state
	}
}
