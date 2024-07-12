import React, { ReactElement, createContext } from 'react'

export type TitleContextType = {
	title: string
	icon?: string | ReactElement | null
} | null

export const TitleContext = createContext<TitleContextType>({ title: 'Mixdown', icon: null })
export const TitleDispatchContext = createContext<React.Dispatch<TitleContextAction>>(() => {})
export type TitleContextActionType = 'SET_TITLE'

export interface TitleContextAction {
	type: TitleContextActionType
	title: string
	icon: string | ReactElement | null
}

export const TitleContextReducer = (state: TitleContextType, action: TitleContextAction): TitleContextType => {
	// console.log(`TitleContextReducer received ${action.type} ACTION`, action)
	switch (action.type) {
		case 'SET_TITLE':
			return { title: action.title, icon: action.icon }
		default:
			return state
	}
}
