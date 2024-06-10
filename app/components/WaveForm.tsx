import { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'

interface WaveformProps {
	audioElementRef: React.RefObject<HTMLAudioElement>
}

const Waveform = ({ audioElementRef }: WaveformProps) => {
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		console.log('Rebuilding Waveform')
		if (!audioElementRef?.current || !containerRef?.current) return
		console.log('creating wavesurfer')
		console.log('containerRef', containerRef.current)
		console.log('audioElementRef', audioElementRef.current)
		const waveSurfer = WaveSurfer.create({
			container: containerRef.current,
			fillParent: true,
			cursorWidth: 0,
			waveColor: 'orange',
			progressColor: ' purple',
			media: audioElementRef.current,
			mediaControls: false,
		})

		console.log('WaveSurfer get media element', waveSurfer.getMediaElement())

		return () => {
			waveSurfer.destroy()
		}
	}, [audioElementRef, containerRef])

	return <div id="wavecontainer" className="z-50 h-full w-full" ref={containerRef} />
}

export default Waveform
