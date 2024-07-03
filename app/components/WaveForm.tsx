import { cn } from '#app/utils/misc'
import { useEffect, useRef } from 'react'
import { default as WaveSurfer } from 'wavesurfer.js'

interface WaveformProps {
	className?: string
	audioElementRef?: React.RefObject<HTMLAudioElement>
	currentSrc?: string
}

const Waveform = ({ className, audioElementRef, currentSrc }: WaveformProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	// const hoverRef = useRef<HTMLDivElement>(null)
	// const [duration, setDuration] = useState('0:00')
	// const [currentTime, setCurrentTime] = useState('0:00')

	useEffect(() => {
		if (!currentSrc || !audioElementRef?.current || !containerRef?.current) return
		const canvas = document.createElement('canvas')
		const ctx = canvas?.getContext('2d')
		if (!ctx || !canvas) {
			console.error('Could not get canvas context')
			return
		}

		// Define the waveform gradient
		const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1.35)
		gradient.addColorStop(0, '#656666') // Top color
		gradient.addColorStop((canvas.height * 0.7) / canvas.height, '#656666') // Top color
		gradient.addColorStop((canvas.height * 0.7 + 1) / canvas.height, '#ffffff') // White line
		gradient.addColorStop((canvas.height * 0.7 + 2) / canvas.height, '#ffffff') // White line
		gradient.addColorStop((canvas.height * 0.7 + 3) / canvas.height, '#B1B1B1') // Bottom color
		gradient.addColorStop(1, '#B1B1B1') // Bottom color

		// Define the progress gradient
		const progressGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1.35)
		progressGradient.addColorStop(0, '#EE772F') // Top color
		progressGradient.addColorStop((canvas.height * 0.7) / canvas.height, '#EB4926') // Top color
		progressGradient.addColorStop((canvas.height * 0.7 + 1) / canvas.height, '#ffffff') // White line
		progressGradient.addColorStop((canvas.height * 0.7 + 2) / canvas.height, '#ffffff') // White line
		progressGradient.addColorStop((canvas.height * 0.7 + 3) / canvas.height, '#F6B094') // Bottom color
		progressGradient.addColorStop(1, '#F6B094') // Bottom color

		const waveSurfer = WaveSurfer.create({
			container: containerRef.current,
			waveColor: gradient,
			progressColor: progressGradient,
			barWidth: 2,
			media: audioElementRef.current,
			mediaControls: false,
			autoplay: false,
			interact: true,
		})

		waveSurfer.on('click', relativeX => {
			console.log('click', relativeX)
		})

		// Cleanup
		return () => {
			waveSurfer.destroy()
		}
	}, [audioElementRef, containerRef, currentSrc])

	return <div className={cn(className, 'z-50 h-full w-full')} id="wavecontainer" ref={containerRef} />
}

export default Waveform

// // Hover effect
// const onPointerMove = (e: PointerEvent): void => {
// 	if (!hoverRef.current) return
// 	hoverRef.current.style.width = `${e.offsetX}px`
// }
// containerRef.current.addEventListener('pointermove', onPointerMove)

// Current time & duration
// const formatTime = (seconds: number) => {
// 	const minutes = Math.floor(seconds / 60)
// 	const secondsRemainder = Math.round(seconds) % 60
// 	const paddedSeconds = `0${secondsRemainder}`.slice(-2)
// 	return `${minutes}:${paddedSeconds}`
// }

// waveSurfer.on('decode', duration => setDuration(formatTime(duration)))
// waveSurfer.on('timeupdate', currentTime => setCurrentTime(formatTime(currentTime)))
/* <div
				id="hover"
				ref={hoverRef}
				className="pointer-events-none z-10 h-full w-0 bg-white/50 opacity-0 mix-blend-overlay transition-opacity duration-200 ease-linear hover:opacity-100"
			/>
			<div className="flex justify-between">
				<div>{currentTime}</div>
				<div>{duration}</div>
			</div> */
