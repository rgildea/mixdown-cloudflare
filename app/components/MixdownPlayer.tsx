import AudioPlayer from 'react-h5-audio-player'
import 'react-h5-audio-player/lib/styles.css'

export default function MixdownPlayer(props: { url?: string }) {
	return (
		<>
			{props.url && <p>Playing: {props.url}</p>}
			<AudioPlayer
				autoPlay={false}
				onPlay={() => console.log('onPlay')}
				showDownloadProgress={true}
				showFilledProgress={true}
				showJumpControls={false}
				src={props.url}
			/>
		</>
	)
}
