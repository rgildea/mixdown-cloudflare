import React, { createContext, useReducer } from 'react'

type PlayerContextType = string | null

export const PlayerContext = createContext<PlayerContextType>(null)
export const PlayerDispatchContext = createContext<React.Dispatch<PlayerContextAction>>(() => {})
export type PlayerContextActionType = 'PLAY' | 'PAUSE'
export interface PlayerContextAction {
	type: PlayerContextActionType
	url?: string
}

export const PlayerContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [currentFileURL, dispatch] = useReducer<
		(state: PlayerContextType, action: PlayerContextAction) => PlayerContextType
	>(PlayerContextReducer, null)

	return (
		<PlayerContext.Provider value={currentFileURL}>
			<PlayerDispatchContext.Provider value={dispatch}>{children}</PlayerDispatchContext.Provider>
		</PlayerContext.Provider>
	)
}

export const PlayerContextReducer = (state: PlayerContextType, action: PlayerContextAction): PlayerContextType => {
	console.log('PlayerContextReducer', state, action)
	switch (action.type) {
		case 'PLAY':
			if (!action.url) {
				throw new Error('Url missing from Play action')
			}
			return action.url
		case 'PAUSE':
			return state
		default:
			return state
	}
}
