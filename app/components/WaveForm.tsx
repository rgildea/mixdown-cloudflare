import { useRef, useEffect } from 'react'

// This function takes in the audio data, analyzes it, and generates a waveform
// that is visualized on a canvas element.
function animateBars(
	analyser: AnalyserNode,
	canvas: HTMLCanvasElement,
	canvasCtx: CanvasRenderingContext2D,
	dataArray: Uint8Array,
	bufferLength: number,
) {
	// Analyze the audio data using the Web Audio API's `getByteFrequencyData` method.
	analyser.getByteFrequencyData(dataArray)

	// Set the canvas fill style to black.
	canvasCtx.fillStyle = '#000'

	// Calculate the height of the canvas.
	const HEIGHT: number = canvas.height / 2

	// Calculate the width of each bar in the waveform based on the canvas width and the buffer length.
	const barWidth: number = Math.ceil(canvas.width / bufferLength) * 2.5

	// Initialize variables for the bar height and x-position.
	let barHeight: number
	let x: number = 0

	// Loop through each element in the `dataArray`.
	for (let i = 0; i < bufferLength; i++) {
		// Calculate the height of the current bar based on the audio data and the canvas height.
		barHeight = (dataArray[i] / 255) * HEIGHT

		// Generate random RGB values for each bar.
		const maximum: number = 10
		const minimum: number = -10
		const r: number = 242 + Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
		const g: number = 104 + Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
		const b: number = 65 + Math.floor(Math.random() * (maximum - minimum + 1)) + minimum

		// Set the canvas fill style to the random RGB values.
		canvasCtx.fillStyle = `rgb(${r},${g},${b})`

		// Draw the bar on the canvas at the current x-position and with the calculated height and width.
		canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight)

		// Update the x-position for the next bar.
		x += barWidth + 1
	}
}

// Component to render the waveform
const WaveForm = ({ size, analyzerData }: { size: number[]; analyzerData: any }) => {
	// Ref for the canvas element
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const { dataArray, analyzer, bufferLength } = analyzerData

	// Effect to draw the waveform on mount and update
	useEffect(() => {
		// Function to draw the waveform
		const draw = (dataArray: Uint8Array, analyzer: AnalyserNode, bufferLength: number) => {
			const canvas = canvasRef?.current
			if (!canvas || !analyzer) {
				return
			}
			const canvasCtx = canvas.getContext('2d') as CanvasRenderingContext2D

			const animate = () => {
				requestAnimationFrame(animate)
				// eslint-disable-next-line no-self-assign
				canvas.width = size[0]
				canvas.height = size[1]
				console.log('drawing')
				console.log('Setting canvas width and height', size[0], size[1])
				animateBars(analyzer, canvas, canvasCtx, dataArray, bufferLength)
			}

			animate()
		}

		draw(dataArray, analyzer, bufferLength)
	}, [size, dataArray, analyzer, bufferLength])

	// Return the canvas element
	return (
		<canvas
			style={{
				position: 'relative',
				top: '0',
				left: '0',
				zIndex: '60',
			}}
			ref={canvasRef}
			width={window.innerWidth}
			height={window.innerHeight}
		/>
	)
}

export default WaveForm
