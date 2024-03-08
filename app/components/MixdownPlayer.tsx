import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

export default function MixdownPlayer(props: { url: string }) {
  console.log("player: ", typeof AudioPlayer)
  return (

    <AudioPlayer
      autoPlay
      src={props.url}
      onPlay={() => console.log("onPlay")}
    />

  );
}