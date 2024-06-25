import Logo from '#app/components/Logo'
import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import {
	ActionFunctionArgs,
	HeadersFunction,
	LinksFunction,
	LoaderFunctionArgs,
	MetaFunction,
	json,
} from '@remix-run/cloudflare'
import {
	Form,
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useFetcher,
	useFetchers,
	useLoaderData,
	useSubmit,
} from '@remix-run/react'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { z } from 'zod'
import leagueSpartanFontStyleSheetUrl from './styles/font-league_spartan.css?url'
import nourdFontStyleSheetUrl from './styles/font-nourd.css?url'
import pixerFontStyleSheetUrl from './styles/font-pixer.css?url'
import tailwindStyleSheetUrl from './styles/tailwind.css?url'

import { getFormProps, useForm } from '@conform-to/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useReducer, useRef } from 'react'
import MixdownPlayer from './components/MixdownPlayer.tsx'
import { GeneralErrorBoundary } from './components/error-boundary.tsx'
import { EpicProgress } from './components/progress-bar.tsx'
import { useToast } from './components/toaster.tsx'
import { Button } from './components/ui/button.tsx'
import { CardTitle } from './components/ui/card.tsx'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuTrigger,
} from './components/ui/dropdown-menu.tsx'
import { Icon } from './components/ui/icon.tsx'
import { EpicToaster } from './components/ui/sonner.tsx'
import { PlayerContext, PlayerContextReducer, PlayerDispatchContext } from './contexts/PlayerContext.tsx'
import { TitleContext, TitleContextReducer, TitleDispatchContext } from './contexts/TitleContext.tsx'
import { getUserId, logout } from './utils/auth.server'
import { ClientHintCheck, getHints, useHints } from './utils/client-hints.tsx'
import { getHoneypot } from './utils/honeypot.server.ts'
import { combineHeaders, getDomainUrl, getUserImgSrc } from './utils/misc.tsx'
import { useNonce } from './utils/nonce-provider.ts'
import { useRequestInfo } from './utils/request-info.ts'
import { Theme, getTheme, setTheme } from './utils/theme.server.ts'
import { makeTimings, time } from './utils/timing.server.ts'
import { getToast } from './utils/toast.server'
import { useOptionalUser, useUser } from './utils/user.ts'

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
						select: {
							id: true,
							name: true,
							username: true,
							email: true,
							image: { select: { id: true } },
							roles: {
								select: {
									name: true,
									permissions: {
										select: { entity: true, action: true, access: true },
									},
								},
							},
						},
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
			// ENV: getEnv(),
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

const ThemeFormSchema = z.object({
	theme: z.enum(['system', 'light', 'dark']),
})

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
}: {
	children: React.ReactNode
	nonce: string
	theme?: Theme
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
			{/* <body className="m-0 h-full overflow-hidden bg-background text-foreground"> */}
			<body className="m-0 h-full overflow-hidden bg-background text-foreground">
				{children}
				{/* <script
					nonce={nonce}
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(env)}`,
					}}
				/> */}
				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
			</body>
		</html>
	)
}

function App() {
	const data = useLoaderData<typeof loader>()
	const nonce = useNonce()
	const user = useOptionalUser()
	const theme = useTheme()
	// const isOnSearchPage = matches.find(m => m.id === 'routes/users+/index')
	// const searchBar = null //isOnSearchPage ? null : <SearchBar status="idle" /> // Change the variable name to 'searchBar'
	useToast(data.toast)
	// const navigate = useNavigate()
	// const location = useLocation()
	// const shouldShowBackButton = location.pathname !== '/' && location.pathname !== '/dashboard'
	const [playerState, playerDispatch] = useReducer(PlayerContextReducer, null)
	const [titleState, titleDispatch] = useReducer(TitleContextReducer, null)
	const title = titleState?.title ?? ''
	const icon = titleState?.icon

	return (
		<TitleContext.Provider value={titleState}>
			<TitleDispatchContext.Provider value={titleDispatch}>
				<PlayerContext.Provider value={playerState}>
					<PlayerDispatchContext.Provider value={playerDispatch}>
						<Document nonce={nonce} theme={theme} env={{}}>
							<AnimatePresence>
								{/* <motion.div layout className="flex min-h-dvh flex-col"> */}
								<motion.div key="main" layout="size" className="min-h-dvh">
									<header className="container mt-1 h-12 shrink-0 grow-0 pb-0  ">
										<nav className="grid grid-cols-3 items-center">
											{/* <Button
										className={`p-0.5 ${!shouldShowBackButton ? 'hidden' : ''}`}
										onClick={() => {
											navigate('..')
											}}
											variant="ghost"
										size="sm"
										>
										<InlineIcon className="vertical-align-0 size-12" icon="mdi:chevron-left" />
										</Button> */}
											<Link className="col-span-2" to="/">
												<CardTitle className="flex flex-nowrap items-center text-4xl text-card-foreground">
													{/* {icon && <InlineIcon className="shrink-0" icon={icon as unknown as string} />} */}
													{icon && <Icon name="mixdown-initials" />}
													{title}
												</CardTitle>
											</Link>
											{/* <div className="col-span-1 mx-auto justify-center">
												<Logo size="sm" className="invisible" />
											</div> */}
											{/* <div className="ml-auto max-w-sm flex-1 sm:block">{searchBar}</div> */}
											<div className="col-span-1 flex justify-end space-x-1">
												<ThemeSwitch userPreference={data.requestInfo.userPrefs.theme} />

												{user ? (
													<UserDropdown />
												) : (
													<Button asChild variant="default" size="lg">
														<Link to="/login">Log In</Link>
													</Button>
												)}
											</div>
											{/* <div className="block w-full sm:hidden">{searchBar}</div> */}
										</nav>
									</header>

									<div className="flex grow flex-col items-center overflow-y-scroll p-2 md:overflow-auto">
										<Outlet />

										<Logo size="sm" className="visible text-foreground" />
										<div className="mt-2 flex w-max items-center text-sm text-muted-foreground">
											<Link to="https://www.ryangildea.com">© {new Date().getFullYear()} Ryan Gildea</Link>
											&nbsp;
											<Link to="https://github.com/rgildea/">
												<InlineIcon className="size-3" icon="mdi:github" />
											</Link>{' '}
											&nbsp;
											<Link target="_blank" to="https://www.linkedin.com/in/ryangildea/" rel="noreferrer">
												<InlineIcon className="size-3" icon="mdi:linkedin" />
											</Link>
										</div>
									</div>
									{/* <Spacer className="min-h-[442px] shrink-0 grow-0" size="player" /> */}

									<MixdownPlayer className="fixed bottom-0 mt-auto shrink-0 grow-0" key="player" />
								</motion.div>
							</AnimatePresence>
							<EpicToaster closeButton position="top-center" theme={theme} />
							<EpicProgress />
						</Document>
					</PlayerDispatchContext.Provider>
				</PlayerContext.Provider>
			</TitleDispatchContext.Provider>
		</TitleContext.Provider>
	)
}

export default function AppWithProviders() {
	const data = useLoaderData<typeof loader>()
	return (
		<HoneypotProvider {...data.honeyProps}>
			<App />
		</HoneypotProvider>
	)
}

function UserDropdown() {
	const user = useUser()
	const submit = useSubmit()
	const formRef = useRef<HTMLFormElement>(null)
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button asChild variant="ghost">
					<Link
						to={`/users/${user.username}`}
						// this is for progressive enhancement
						onClick={e => e.preventDefault()}
						className="flex items-center gap-2"
					>
						<img
							className="h-8 w-8 rounded-full object-cover"
							alt={user.name ?? user.username}
							src={getUserImgSrc(user.image?.id)}
						/>
						{/* <span className="text-body-sm font-bold">{user.name ?? user.username}</span> */}
					</Link>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuPortal>
				<DropdownMenuContent sideOffset={8} align="start">
					<DropdownMenuItem asChild>
						{/* <Link prefetch="intent" to={`/users/${user.username}`}> */}
						<>
							<Icon className="text-body-md" name="avatar">
								<span className="text-xs text-muted-foreground">
									{user.name ?? user.username} ({user.email}){' '}
								</span>
							</Icon>
						</>
						{/* </Link> */}
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link prefetch="intent" to={`/tracks`}>
							<Icon className="text-body-md" name="pencil-2">
								Tracks
							</Icon>
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem
						asChild
						// this prevents the menu from closing before the form submission is completed
						onSelect={event => {
							event.preventDefault()
							submit(formRef.current)
						}}
					>
						<Form action="/logout" method="POST" ref={formRef}>
							<Icon className="text-body-md" name="exit">
								<button type="submit">Logout</button>
							</Icon>
						</Form>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenuPortal>
		</DropdownMenu>
	)
}

/**
 * @returns the user's theme preference, or the client hint theme if the user
 * has not set a preference.
 */
export function useTheme() {
	const hints = useHints()
	const requestInfo = useRequestInfo()
	const optimisticMode = useOptimisticThemeMode()
	if (optimisticMode) {
		return optimisticMode === 'system' ? hints.theme : optimisticMode
	}
	return requestInfo.userPrefs.theme ?? hints.theme
}

/**
 * If the user's changing their theme mode preference, this will return the
 * value it's being changed to.
 */
export function useOptimisticThemeMode() {
	const fetchers = useFetchers()
	const themeFetcher = fetchers.find(f => f.formAction === '/')

	if (themeFetcher && themeFetcher.formData) {
		const submission = parseWithZod(themeFetcher.formData, {
			schema: ThemeFormSchema,
		})

		if (submission.status === 'success') {
			return submission.value.theme
		}
	}
}

function ThemeSwitch({ userPreference }: { userPreference?: Theme | null }) {
	const fetcher = useFetcher<typeof action>()

	const [form] = useForm({
		id: 'theme-switch',
		lastResult: fetcher.data?.result,
	})

	const optimisticMode = useOptimisticThemeMode()
	const mode = optimisticMode ?? userPreference ?? 'system'
	const nextMode = mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system'
	const modeLabel = {
		light: (
			<Icon name="sun">
				<span className="sr-only">Light</span>
			</Icon>
		),
		dark: (
			<Icon name="moon">
				<span className="sr-only">Dark</span>
			</Icon>
		),
		system: (
			<Icon name="laptop">
				<span className="sr-only">System</span>
			</Icon>
		),
	}

	return (
		<fetcher.Form method="POST" {...getFormProps(form)}>
			<input type="hidden" name="theme" value={nextMode} />
			<div className="flex gap-2">
				<button type="submit" className="primary flex h-8 w-8 cursor-pointer items-center justify-center">
					{modeLabel[mode]}
				</button>
			</div>
		</fetcher.Form>
	)
}

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
