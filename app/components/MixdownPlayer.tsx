import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player'
import '#app/styles/player.css'
import { PlayerContext } from '#app/contexts/PlayerContext'
import { useContext } from 'react'
import { useRouteLoaderData } from '@remix-run/react'
import { TrackWithVersions } from '#app/utils/track.server'
import { loader as loaderTracks } from '#app/routes/tracks+/_layout'

export const getLatestVersionUrl = (trackId: string, tracks: TrackWithVersions[]) => {
	const found = tracks.find(track => track.id == trackId)
	return found?.versions[0].audioFile?.url
}

export default function MixdownPlayer() {
	const playerState = useContext(PlayerContext)
	const trackId = playerState?.trackId ?? null
	const loaderData = useRouteLoaderData<typeof loaderTracks>('routes/tracks+/_layout') as {
		tracks: TrackWithVersions[]
	}

	const tracks = loaderData?.tracks ?? []
	const url = trackId != null ? getLatestVersionUrl(trackId, tracks) : null
	return (
		<div className="fixed inset-x-0 bottom-0 z-50">
			{trackId && (
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
