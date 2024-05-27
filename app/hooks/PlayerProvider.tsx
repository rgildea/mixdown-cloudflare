import React, { useState } from 'react'
import PlayerContext from './PlayerContext'

function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentFileURL, setCurrentFileURL] = useState<string>()

  const value = {
    currentFileURL,
    setCurrentFileURL,
  }

  return (<PlayerContext.Provider value={value}>
    {children}
    </PlayerContext.Provider>)


export default PlayerProvider;