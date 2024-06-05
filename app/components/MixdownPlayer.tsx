import { PlayerContext } from '#app/contexts/PlayerContext'
import '#app/styles/player.css'
import { TrackWithVersions } from '#app/utils/track.server'
import { useMatches } from '@remix-run/react'
import { useContext } from 'react'
import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player'

export const getLatestVersionUrl = (trackId: string, tracks: TrackWithVersions[]) => {
	const found = tracks.find(track => track.id == trackId)
	return found?.versions[0].audioFile?.url
}

export default function MixdownPlayer() {
	const matches = useMatches()
	console.log('MixdownPlayer matches:', matches)
	const playerState = useContext(PlayerContext)
	const track = playerState?.track ?? null
	const url = track?.versions[0].audioFile?.url // 'https://naturecreepsbeneath.com/player/1879830/tracks/3056260.mp3'
	console.log('MixdownPlayer Loading URL: ', url)
	return (
		<div className="fixed inset-x-0 bottom-0 z-50">
			{track && (
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
