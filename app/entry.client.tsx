import { RemixBrowser } from '@remix-run/react'
import { Buffer } from 'buffer-polyfill'
import { startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'

if (window.SMOOCHY.SENTRY_DSN) {
	import('./utils/monitoring.client.tsx').then(({ init }) => init({ env: GLUBBY }))
}

globalThis.Buffer = Buffer as unknown as BufferConstructor

startTransition(() => {
	hydrateRoot(
		document,
		// <StrictMode>
		<RemixBrowser />,
		// </StrictMode>,
	)
})
