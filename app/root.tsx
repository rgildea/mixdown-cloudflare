import Header from '#app/components/Header'
import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
	ActionFunctionArgs,
	HeadersFunction,
	LinksFunction,
	LoaderFunctionArgs,
	MetaFunction,
	json,
} from '@remix-run/cloudflare'
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react'
import { withSentry } from '@sentry/remix'
import { useReducer } from 'react'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { GeneralErrorBoundary } from './components/error-boundary.tsx'
import Footer from './components/Footer.tsx'
import { EpicProgress } from './components/progress-bar.tsx'
import { useToast } from './components/toaster.tsx'
import { EpicToaster } from './components/ui/sonner.tsx'
import { PlayerContext, PlayerContextReducer, PlayerDispatchContext } from './contexts/PlayerContext.tsx'
import { TitleContext, TitleContextReducer, TitleDispatchContext } from './contexts/TitleContext.tsx'
import leagueSpartanFontStyleSheetUrl from './styles/font-league_spartan.css?url'
import nourdFontStyleSheetUrl from './styles/font-nourd.css?url'
import pixerFontStyleSheetUrl from './styles/font-pixer.css?url'
import tailwindStyleSheetUrl from './styles/tailwind.css?url'
import { getUserId, logout } from './utils/auth.server'
import { ClientHintCheck, getHints } from './utils/client-hints.tsx'
import { getEnv } from './utils/env.server.ts'
import { getHoneypot } from './utils/honeypot.server.ts'
import { combineHeaders, getDomainUrl } from './utils/misc.tsx'
import { useNonce } from './utils/nonce-provider.ts'
import { Theme, ThemeFormSchema, getTheme, setTheme, useTheme } from './utils/theme'
import { makeTimings, time } from './utils/timing.server.ts'
import { getToast } from './utils/toast.server'
import { UserSelect } from './utils/user.server.ts'

export const links: LinksFunction = () => {
	return [
		// Preload svg sprite as a resource to avoid render blocking
		// { rel: 'preload', href: iconsHref, as: 'image' },
		// Preload CSS as a resource to avoid render blocking
		{ rel: 'preload', href: tailwindStyleSheetUrl, as: 'style' },
		{ rel: 'mask-icon', href: '/favicons/mask-icon.svg' },
		{
			rel: 'alternate icon',
			type: 'image/png',
			href: '/favicons/favicon-32x32.png',
		},
		{ rel: 'apple-touch-icon', href: '/favicons/apple-touch-icon.png' },
		{
			rel: 'manifest',
			href: '/site.webmanifest',
			crossOrigin: 'use-credentials',
		} as const, // necessary to make typescript happy
		//These should match the css preloads above to avoid css as render blocking resource
		{ rel: 'icon', type: 'image/svg+xml', href: '/favicons/favicon.svg' },
		{ rel: 'stylesheet', href: tailwindStyleSheetUrl },
		{ rel: 'preload', href: leagueSpartanFontStyleSheetUrl, as: 'style' },
		{ rel: 'stylesheet', href: leagueSpartanFontStyleSheetUrl },
		{ rel: 'preload', href: pixerFontStyleSheetUrl, as: 'style' },
		{ rel: 'stylesheet', href: pixerFontStyleSheetUrl },
		{ rel: 'preload', href: nourdFontStyleSheetUrl, as: 'style' },
		{ rel: 'stylesheet', href: nourdFontStyleSheetUrl },
	].filter(Boolean)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{ title: data ? 'Mixdown!' : 'Error | Mixdown!' },
		{ name: 'description', content: `The best way to share your mixes` },
	]
}

export async function loader({
	request,
	context: {
		storageContext,
		cloudflare: {
			env: { HONEYPOT_SECRET },
		},
	},
}: LoaderFunctionArgs) {
	const timings = makeTimings('root loader')
	const userId = await time(() => getUserId(storageContext, request), {
		timings,
		type: 'getUserId',
		desc: 'getUserId in root',
	})

	const user = userId
		? await time(
				() =>
					storageContext.db.user.findUniqueOrThrow({
						select: UserSelect,
						where: { id: userId },
					}),
				{ timings, type: 'find user', desc: 'find user in root' },
			)
		: null
	if (userId && !user) {
		console.info('something weird happened')
		// something weird happened... The user is authenticated but we can't find
		// them in the database. Maybe they were deleted? Let's log them out.
		await logout({
			db: storageContext.db,
			authSessionStorage: storageContext.authSessionStorage,
			request,
			redirectTo: '/',
		})
	}
	const { toast, headers: toastHeaders } = await getToast(storageContext.toastSessionStorage, request)

	const honeyProps = getHoneypot(HONEYPOT_SECRET).getInputProps()

	return json(
		{
			user,
			requestInfo: {
				hints: getHints(request),
				origin: getDomainUrl(request),

				path: new URL(request.url).pathname,
				userPrefs: {
					theme: getTheme(request),
				},
			},
			ENV: getEnv(),
			toast,
			honeyProps,
		},
		{
			headers: combineHeaders({ 'Server-Timing': timings.toString() }, toastHeaders),
		},
	)
}
export const headers: HeadersFunction = ({ loaderHeaders }) => {
	const headers = {
		'Server-Timing': loaderHeaders.get('Server-Timing') ?? '',
	}
	return headers
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: ThemeFormSchema,
	})

	invariantResponse(submission.status === 'success', 'Invalid theme received')

	const { theme } = submission.value

	const responseInit = {
		headers: { 'set-cookie': setTheme(theme) },
	}
	return json({ result: submission.reply() }, responseInit)
}

function Document({
	children,
	nonce,
	theme = 'light',
	data,
}: {
	children: React.ReactNode
	nonce: string
	theme?: Theme
	data?: ReturnType<typeof useLoaderData<typeof loader>>
	env?: Record<string, string>
}) {
	return (
		<html lang="en" className={`${theme} h-full overflow-x-hidden`}>
			<head>
				<ClientHintCheck nonce={nonce} />
				<Meta />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Links />
			</head>
			<body className="m-0 h-full overflow-hidden bg-background text-foreground">
				{children}
				<script
					nonce={nonce}
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(data?.ENV)}`,
					}}
				/>
				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
			</body>
		</html>
	)
}

function App() {
	const data = useLoaderData<typeof loader>()
	const nonce = useNonce()
	const theme = useTheme()
	// const isOnSearchPage = matches.find(m => m.id === 'routes/users+/index')
	// const searchBar = null //isOnSearchPage ? null : <SearchBar status="idle" /> // Change the variable name to 'searchBar'
	useToast(data.toast)

	const [playerState, playerDispatch] = useReducer(PlayerContextReducer, null)
	const [titleState, titleDispatch] = useReducer(TitleContextReducer, null)

	return (
		<TitleContext.Provider value={titleState}>
			<TitleDispatchContext.Provider value={titleDispatch}>
				<PlayerContext.Provider value={playerState}>
					<PlayerDispatchContext.Provider value={playerDispatch}>
						<Document nonce={nonce} theme={theme} data={data} env={{}}>
							<div className="flex grow flex-col items-center gap-2 overflow-y-scroll p-2 md:overflow-auto">
								<Header />
								<div className="mx-auto flex w-full flex-col ">
									<Outlet context="my-value-root" />
								</div>
								<Footer />
							</div>
							<EpicToaster closeButton position="top-center" theme={theme} />
							<EpicProgress />
						</Document>
					</PlayerDispatchContext.Provider>
				</PlayerContext.Provider>
			</TitleDispatchContext.Provider>
		</TitleContext.Provider>
	)
}

function AppWithProviders() {
	const data = useLoaderData<typeof loader>()
	return (
		<HoneypotProvider {...data.honeyProps}>
			<App />
		</HoneypotProvider>
	)
}

export default withSentry(AppWithProviders)

export function ErrorBoundary() {
	// the nonce doesn't rely on the loader so we can access that
	const nonce = useNonce()

	// NOTE: you cannot use useLoaderData in an ErrorBoundary because the loader
	// likely failed to run so we have to do the best we can.
	// We could probably do better than this (it's possible the loader did run).
	// This would require a change in Remix.

	// Just make sure your root route never errors out and you'll always be able
	// to give the user a better UX.

	return (
		<Document nonce={nonce}>
			<GeneralErrorBoundary />
		</Document>
	)
}
