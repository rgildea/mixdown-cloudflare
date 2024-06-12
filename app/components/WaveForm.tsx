import { cn } from '#app/utils/misc'
import { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'

interface WaveformProps {
	className?: string
	audioElementRef?: React.RefObject<HTMLAudioElement>
	currentSrc?: string
}

const Waveform = ({ className, audioElementRef, currentSrc }: WaveformProps) => {
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!currentSrc || !audioElementRef?.current || !containerRef?.current) return
		console.log('Rebuilding Waveform')
		console.log('Creating wavesurfer')
		console.log('containerRef', containerRef.current)
		const waveSurfer = WaveSurfer.create({
			container: containerRef.current,
			fillParent: true,

			waveColor: 'orange',
			progressColor: ' purple',
			media: audioElementRef.current,
			mediaControls: false,
		})

		if (!currentSrc) {
			console.log('No audio src')
			return
		}
		// waveSurfer.load(audioElementRef.current.src).then(() => {
		// 	console.log('WaveSurfer loaded')
		// 	waveSurfer.setMediaElement(audioElementRef.current as HTMLMediaElement)
		// })

		console.log('WaveSurfer loading', currentSrc)
		console.log('WaveSurfer get media element', waveSurfer.getMediaElement())

		return () => {
			console.log('Destroying Waveform')
			waveSurfer.destroy()
		}
	}, [audioElementRef, containerRef, currentSrc])

	return <div className={cn(className, 'z-50 h-full w-full bg-purple-500')} id="wavecontainer" ref={containerRef} />
}

export default Waveform
