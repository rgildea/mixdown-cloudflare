import { usePlayerDispatchContext } from '#app/contexts/PlayerContext'
import { cn } from '#app/utils/misc'
import { useEffect, useRef, useState } from 'react'
import { default as WaveSurfer } from 'wavesurfer.js'

// Current time & duration
export const formatTime = (seconds: number) => {
	const minutes = Math.floor(seconds / 60)
	const secondsRemainder = Math.round(seconds) % 60
	const paddedSeconds = `0${secondsRemainder}`.slice(-2)
	return `${minutes}:${paddedSeconds}`
}

interface WaveformProps {
	className?: string
	audioElementRef?: React.RefObject<HTMLAudioElement>
	currentSrc?: string
}

const Waveform = ({ className, audioElementRef, currentSrc }: WaveformProps) => {
	const waveformRenderCounter = useRef(0)
	// const redrawCount = useRef(0)
	const containerRef = useRef<HTMLDivElement>(null)
	const hoverRef = useRef<HTMLDivElement>(null)
	const [duration, setDuration] = useState('0:00')
	const [currentTime, setCurrentTime] = useState('0:00')
	const playerDispatch = usePlayerDispatchContext()

	useEffect(() => {
		if (!currentSrc || !audioElementRef?.current || !containerRef?.current) return
		const canvas = document.createElement('canvas')
		canvas.id = 'canvas'
		canvas.className = 'border-2 border-red-600'
		const ctx = canvas?.getContext('2d')
		if (!ctx || !canvas) {
			console.error('Could not get canvas context')
			return
		}

		// Define the waveform gradient
		const gradient = ctx?.createLinearGradient(0, 0, 0, canvas.height * 1.35)
		gradient?.addColorStop((canvas.height * 0.7) / canvas.height, '#656666') // Top color
		gradient?.addColorStop((canvas.height * 0.7 + 1) / canvas.height, '#ffffff') // White line
		gradient?.addColorStop((canvas.height * 0.7 + 2) / canvas.height, '#ffffff') // White line
		gradient?.addColorStop(0, '#656666') // Top color
		gradient?.addColorStop((canvas.height * 0.7 + 3) / canvas.height, '#B1B1B1') // Bottom color
		gradient?.addColorStop(1, '#B1B1B1') // Bottom color

		// Define the progress gradient
		const progressGradient = ctx?.createLinearGradient(0, 0, 0, canvas.height * 1.35)
		progressGradient?.addColorStop(0, '#EE772F') // Top color
		progressGradient?.addColorStop((canvas.height * 0.7) / canvas.height, '#EB4926') // Top color
		progressGradient?.addColorStop((canvas.height * 0.7 + 1) / canvas.height, '#ffffff') // White line
		progressGradient?.addColorStop((canvas.height * 0.7 + 2) / canvas.height, '#ffffff') // White line
		progressGradient?.addColorStop((canvas.height * 0.7 + 3) / canvas.height, '#F6B094') // Bottom color
		progressGradient?.addColorStop(1, '#F6B094') // Bottom color

		// Error handling
		if (!canvas) {
			console.error('Error: Canvas element is missing.')
		}
		if (!ctx) {
			console.error('Error: Canvas context is missing.')
		}
		if (!audioElementRef) {
			console.error('Error: Audio element is missing.')
		}
		if (!containerRef.current) {
			console.error('Error: Container is missing.')
		}
		if (!hoverRef.current) {
			console.error('Error: Hover element is missing.')
		}

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

		waveformRenderCounter.current += 1
		// console.info('Creating Waveform component', waveformRenderCounter.current)

		if (!waveSurfer) {
			console.error('Error: Wavesurfer is not initialized properly.')
		} else {
			// console.info('Wavesurfer is initialized properly.')
		}

		const onClick = (e: number) => {
			if (!playerDispatch) return
			if (!audioElementRef.current) return
			const seekPosition = +(e * waveSurfer.getDuration()).toFixed(2)
			audioElementRef.current.currentTime = seekPosition
		}
		waveSurfer.on('click', onClick)

		// Hover effect
		const onPointerMove = (e: PointerEvent): void => {
			if (!hoverRef.current) return
			hoverRef.current.style.width = `${e.offsetX}px`
		}
		containerRef.current.addEventListener('pointermove', onPointerMove)

		// waveSurfer.on('redraw', () => {
		// 	console.info('Waveform is redrawing')
		// })
		// waveSurfer.on('redrawcomplete', () => {
		// 	redrawCount.current++
		// 	console.info('Waveform redraw complete', redrawCount.current)
		// })
		// waveSurfer.on('seeking', e => {
		// 	console.info('Waveform seeking handler Player is seeking', e)
		// })

		waveSurfer.on('timeupdate', currentTime => setCurrentTime(formatTime(currentTime)))

		waveSurfer.on('decode', duration => {
			setDuration(formatTime(duration))
			// setPercentLoaded(0)
		})
		// Cleanup
		return () => {
			waveSurfer.destroy()
		}
	}, [audioElementRef, containerRef, currentSrc, playerDispatch])

	return (
		<>
			<canvas id="canvas" className={'absolute h-12'} />
			<div
				className={cn(className, 'group relative h-min w-full cursor-pointer')}
				id="wavecontainer"
				ref={containerRef}
			>
				<div
					className={cn(
						'absolute top-1/2 z-[11] -m-1 -translate-y-1/2 bg-black/75 p-0.5 text-xs text-neutral-400',
						'left-1',
					)}
					id="time"
				>
					{currentTime ?? '0:00'}
				</div>
				<div
					id="duration"
					className={cn(
						'absolute top-1/2 z-[11] -m-1 -translate-y-1/2 bg-black/75 p-0.5 text-xs text-neutral-400',
						'right-1',
					)}
				>
					{duration ?? '0:00'}
				</div>
				<div
					id="hover"
					ref={hoverRef}
					className="pointer-events-none absolute top-0 z-10 h-full bg-accent opacity-0 mix-blend-overlay transition-opacity duration-200 ease-linear group-hover:opacity-100"
				/>
			</div>
		</>
	)
}
export default Waveform
