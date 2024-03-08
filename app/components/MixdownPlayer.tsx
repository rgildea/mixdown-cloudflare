import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';


// const RealPlayer = typeof AudioPlayer === "function" ? AudioPlayer : AudioPlayer.default;

export default function MixdownPlayer(props: { url: string }) {
  return (
    <>
      {props.url && <p>Playing: {props.url}</p>}
      <AudioPlayer
        autoPlay={false}
        // autoPlayAfterSrcChange={false}
        onPlay={() => console.log("onPlay")}
        showDownloadProgress={true}
        showFilledProgress={true}
        showJumpControls={false}
        src={props.url}
      />
    </>
  );
}