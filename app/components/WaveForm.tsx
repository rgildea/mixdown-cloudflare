import { usePlayerContext, usePlayerDispatchContext } from '#app/contexts/PlayerContext'
import { cn } from '#app/utils/misc'
import { useEffect, useRef, useState } from 'react'
import { default as WaveSurfer } from 'wavesurfer.js'

interface WaveformProps {
	className?: string
	audioElementRef?: React.RefObject<HTMLAudioElement>
	currentSrc?: string
}

const Waveform = ({ className, audioElementRef, currentSrc }: WaveformProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const hoverRef = useRef<HTMLDivElement>(null)
	const [duration, setDuration] = useState('0:00')
	const [currentTime, setCurrentTime] = useState('0:00')
	const [percentLoaded, setPercentLoaded] = useState(0)
	const playerDispatch = usePlayerDispatchContext()
	const isLoading = usePlayerContext()?.isLoading || true

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
		// gradient.addColorStop((canvas.height * 0.7 + 1) / canvas.height, '#ffffff') // White line
		// gradient.addColorStop((canvas.height * 0.7 + 2) / canvas.height, '#ffffff') // White line
		gradient.addColorStop((canvas.height * 0.7 + 3) / canvas.height, '#B1B1B1') // Bottom color
		gradient.addColorStop(1, '#B1B1B1') // Bottom color

		// Define the progress gradient
		const progressGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1.35)
		progressGradient.addColorStop(0, '#EE772F') // Top color
		progressGradient.addColorStop((canvas.height * 0.7) / canvas.height, '#EB4926') // Top color
		// progressGradient.addColorStop((canvas.height * 0.7 + 1) / canvas.height, '#ffffff') // White line
		// progressGradient.addColorStop((canvas.height * 0.7 + 2) / canvas.height, '#ffffff') // White line
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
			dragToSeek: true,
		})

		const onClick = (e: number) => {
			if (!playerDispatch) return
			console.log('Seeking to', e)
			playerDispatch({ type: 'SEEK', time: e })
		}
		waveSurfer.on('click', onClick)

		// Hover effect
		const onPointerMove = (e: PointerEvent): void => {
			if (!hoverRef.current) return
			hoverRef.current.style.width = `${e.offsetX}px`
		}
		containerRef.current.addEventListener('pointermove', onPointerMove)

		waveSurfer.on('seeking', currentTime => {
			console.log('Seeking', currentTime + 's')
		})

		// Current time & duration
		const formatTime = (seconds: number) => {
			const minutes = Math.floor(seconds / 60)
			const secondsRemainder = Math.round(seconds) % 60
			const paddedSeconds = `0${secondsRemainder}`.slice(-2) //
			return `${minutes}:${paddedSeconds}`
		}

		waveSurfer.on('decode', duration => {
			setDuration(formatTime(duration))
			setPercentLoaded(0)
		})

		waveSurfer.on('timeupdate', currentTime => setCurrentTime(formatTime(currentTime)))
		waveSurfer.on('loading', progress => {
			console.log('Loading', progress)
			setPercentLoaded(progress)
		})

		// Cleanup
		return () => {
			waveSurfer.destroy()
		}
	}, [audioElementRef, containerRef, currentSrc, playerDispatch])

	return (
		<div className={cn(className, 'group relative h-full w-full cursor-pointer')} id="wavecontainer" ref={containerRef}>
			<div className="absolute left-0 top-1/2 z-[11] -translate-y-1/2 transform bg-[rgba(0,0,0,0.5)] p-2 font-mono text-xs leading-tight tracking-tighter text-[#DDDDDD] transition">
				{currentTime}
			</div>
			<div className="absolute right-0 top-1/2 z-[11] -translate-y-1/2 transform bg-[rgba(0,0,0,0.75)] p-2 font-mono text-xs leading-tight tracking-tighter text-[#DDDDDD] transition">
				{duration}
			</div>
			<div
				id="hover"
				ref={hoverRef}
				className="pointer-events-none absolute left-0 top-0 z-10 h-full bg-accent opacity-0 mix-blend-overlay transition-opacity duration-200 ease-linear group-hover:opacity-100"
			/>
			<div className={`${!isLoading ? `invisible ` : ``} absolute z-10 bg-accent bg-center`}>
				<div className="m-auto bg-white text-center text-3xl text-black">{percentLoaded}</div>
			</div>
		</div>
	)
}
export default Waveform
