import { AppLoadContext } from '@remix-run/cloudflare'
import { type PlatformProxy } from 'wrangler'
import { db } from './app/utils/db.server'

// When using `wrangler.toml` to configure bindings,
// `wrangler types` will generate types for those bindings
// into the global `Env` interface.
// Need this empty interface so that typechecking passes
// even if no `wrangler.toml` exists.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Env {
	DATABASE_URL: string
}

type Cloudflare = Omit<PlatformProxy<Env>, 'dispose'>

declare module '@remix-run/cloudflare' {
	interface AppLoadContext {
		cloudflare: Cloudflare
		db: ReturnType<typeof db>
	}
}

type GetLoadContext = (args: {
	request: Request
	context: { cloudflare: Cloudflare } // load context _before_ augmentation
}) => AppLoadContext

// Shared implementation compatible with Vite, Wrangler, and Cloudflare Pages
export const getLoadContext: GetLoadContext = ({ context }) => {
	const DATABASE_URL = context.cloudflare.env.DATABASE_URL as string
	return {
		cloudflare: context.cloudflare,
		db: db(DATABASE_URL),
		extra: 'stuff',
	}
}
