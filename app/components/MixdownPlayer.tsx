import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player'
import '#app/styles/player.css'

export default function MixdownPlayer(props: { url?: string }) {
	return (
		<div className="fixed inset-x-0 bottom-0 z-50">
			{props.url && (
				<>
					<AudioPlayer
						autoPlay={false}
						showDownloadProgress={true}
						showFilledProgress={true}
						showJumpControls={false}
						showFilledVolume={true}
						showSkipControls={false}
						autoPlayAfterSrcChange={true}
						src={props.url}
						customVolumeControls={[]}
						customProgressBarSection={[RHAP_UI.PROGRESS_BAR, RHAP_UI.CURRENT_TIME, RHAP_UI.DURATION]}
					/>
				</>
			)}
		</div>
	)
}
