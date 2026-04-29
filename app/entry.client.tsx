import { HydratedRouter } from 'react-router/dom'
import { Buffer } from 'buffer-polyfill'
import { startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'

if (window?.ENV?.SENTRY_DSN) {
	import('./utils/monitoring.client.tsx').then(({ init }) => init({ env: ENV }))
}

globalThis.Buffer = Buffer as unknown as BufferConstructor

startTransition(() => {
	hydrateRoot(document, <HydratedRouter />)
})
