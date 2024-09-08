import React, { ReactElement, createContext, useContext } from 'react'

export type TitleContextType = {
	title: string
	icon?: string | ReactElement | null
} | null

export const TitleContext = createContext<TitleContextType>({ title: 'Mixdown', icon: null })
export const useTitleContext = () => useContext(TitleContext)
export const TitleDispatchContext = createContext<React.Dispatch<TitleContextAction>>(() => {})
export const useTitleDispatchContext = () => useContext(TitleDispatchContext)

export type TitleContextActionType = 'SET_TITLE'

export interface TitleContextAction {
	type: TitleContextActionType
	title: string
	icon: string | ReactElement | null
}

export const TitleContextReducer = (state: TitleContextType, action: TitleContextAction): TitleContextType => {
	switch (action.type) {
		case 'SET_TITLE':
			return { title: action.title, icon: action.icon }
		default:
			return state
	}
}
