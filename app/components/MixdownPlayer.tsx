import AudioPlayer from 'react-h5-audio-player'
import 'react-h5-audio-player/lib/styles.css'

export default function MixdownPlayer(props: { url?: string }) {
	return (
		<>
			{props.url && (
				<>
					<AudioPlayer
						autoPlay={false}
						showDownloadProgress={true}
						showFilledProgress={true}
						showJumpControls={false}
						showFilledVolume={false}
						src={props.url}
						className="max-w-xl"
					/>
				</>
			)}
		</>
	)
}
