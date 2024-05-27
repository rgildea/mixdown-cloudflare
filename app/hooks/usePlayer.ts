import { useContext } from 'react'
import PlayerContext from './PlayerContext'

function usePlayer() {
	const context = useContext(PlayerContext)

	if (!context) {
		throw new Error('usePlayer must be used within a PlayerProvider')
	}

	return context
}

export default usePlayer
