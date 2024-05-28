import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player'
import '#app/styles/player.css'
import { PlayerContext } from '#app/contexts/PlayerContext'
import { useContext } from 'react'

export default function MixdownPlayer() {
	const url = useContext(PlayerContext)
	console.log('MixdownPlayer url:', url)
	return (
		<div className="fixed inset-x-0 bottom-0 z-50">
			{url && (
				<>
					<AudioPlayer
						onPlay={e => console.info('onPlay', e)}
						onPause={e => console.info('onPause', e)}
						onLoadStart={e => console.info('onLoadStart', e)}
						onCanPlay={e => console.info('onCanPlay', e)}
						onPlayError={e => console.info('onPlayError', e)}
						autoPlay={true}
						showDownloadProgress={true}
						showFilledProgress={true}
						showJumpControls={false}
						showFilledVolume={true}
						showSkipControls={false}
						autoPlayAfterSrcChange={true}
						src={url ?? ''}
						customVolumeControls={[]}
						customProgressBarSection={[RHAP_UI.CURRENT_TIME, RHAP_UI.PROGRESS_BAR, RHAP_UI.DURATION]}
					/>
				</>
			)}
		</div>
	)
}
