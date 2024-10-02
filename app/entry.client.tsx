import { RemixBrowser } from '@remix-run/react'
import { Buffer } from 'buffer-polyfill'
import { startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'

if (window?.ENV?.SENTRY_DSN) {
	import('./utils/monitoring.client.tsx').then(({ init }) => init({ env: ENV }))
}

globalThis.Buffer = Buffer as unknown as BufferConstructor

startTransition(() => {
	const rootElement = document // Ensure this ID matches your root element
	if (rootElement) {
		startTransition(() => {
			hydrateRoot(
				rootElement,
				// <StrictMode>
				<RemixBrowser />,
				// </StrictMode>,
			)
		})
	}
})
