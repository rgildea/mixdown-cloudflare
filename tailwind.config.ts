import type { Config } from 'tailwindcss'
import { extendedTheme } from './app/utils/extended-theme'
import animatePlugin from 'tailwindcss-animate'

export default {
	content: ['./app/**/*.{ts,tsx,jsx,js}'],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: extendedTheme,
	},
	plugins: [animatePlugin],
} satisfies Config
