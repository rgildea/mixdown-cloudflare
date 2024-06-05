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
	useLocation,
	useNavigate,
	useSubmit,
} from '@remix-run/react'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { z } from 'zod'
import leagueSpartanFontStyleSheetUrl from './styles/font-league_spartan.css?url'
import nourdFontStyleSheetUrl from './styles/font-nourd.css?url'
import pixerFontStyleSheetUrl from './styles/font-pixer.css?url'
import tailwindStyleSheetUrl from './styles/tailwind.css?url'

import { getFormProps, useForm } from '@conform-to/react'
import { useReducer, useRef } from 'react'
import MixdownPlayer from './components/MixdownPlayer.tsx'
import { GeneralErrorBoundary } from './components/error-boundary.tsx'
import { EpicProgress } from './components/progress-bar.tsx'
import { useToast } from './components/toaster.tsx'
import { Button } from './components/ui/button.tsx'
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
			<body className="bg-background text-foreground">
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
	const navigate = useNavigate()
	const location = useLocation()
	const isRoot = location.pathname === '/'
	console.log('isRoot:', isRoot)
	const [playerState, dispatch] = useReducer(PlayerContextReducer, null)
	return (
		<PlayerContext.Provider value={playerState}>
			<PlayerDispatchContext.Provider value={dispatch}>
				<Document nonce={nonce} theme={theme} env={{}}>
					<header className="p-2">
						<nav className="flex justify-between">
							<div className="flex">
								<Button
									className={`p-0.5 ${isRoot ? 'hidden' : ''}`}
									onClick={() => {
										navigate('..')
									}}
									variant="ghost"
									size="sm"
								>
									<InlineIcon className="vertical-align-0 size-12" icon="mdi:chevron-left" />
								</Button>
								<Logo />
							</div>
							{/* <div className="ml-auto max-w-sm flex-1 sm:block">{searchBar}</div> */}
							<div className="flex items-center">
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

					<div className="flex min-h-dvh flex-col items-center p-2">
						<Outlet />
					</div>

					<div className="p-2">
						<Logo />
						<ThemeSwitch userPreference={data.requestInfo.userPrefs.theme} />
						HI!
					</div>
					<EpicToaster closeButton position="top-center" theme={theme} />
					<EpicProgress />
					<MixdownPlayer />
				</Document>
			</PlayerDispatchContext.Provider>
		</PlayerContext.Provider>
	)
}

function Logo() {
	return (
		<Link to="/" className="justify-self-star group font-nourd leading-snug">
			<div className="justify-self-starts flex font-light transition group-hover:-translate-x-1">
				<svg
					className="size-7 text-foreground group-hover:rotate-180"
					fill="none"
					viewBox="0 0 87 100"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fill="currentColor"
						d="M85.846687,49.3648695 L39.1453676,22.5140713 C39.1617713,34.917315 39.1617713,47.3236347 39.1617713,59.7299541 L39.1617713,62.0264714 C39.8035657,61.7230031 40.1900777,61.5692186 40.5489087,61.3631469 C42.5860423,60.1861818 44.5944698,58.9538544 46.6664617,57.8384031 C47.5307312,57.3790997 47.7798624,56.8100964 47.7747363,55.8812371 C47.7316765,50.2188868 47.7398783,44.5596121 47.7398783,38.8972616 C47.7398783,37.5767641 47.9223695,37.4711653 49.0521739,38.1211618 C55.4506404,41.7904631 61.8491065,45.4618153 68.2373205,49.1475203 C68.5910251,49.3484658 68.8729635,49.6714134 69.3240651,50.046648 C67.2120896,51.2964044 65.2713273,52.4672182 63.3121109,53.6000983 C57.0315463,57.2263401 50.7458554,60.8443802 44.4601648,64.4654959 C41.6387292,66.0904868 38.823445,67.7226545 36.0030346,69.353797 C35.0229138,69.9197244 34.690739,69.745435 34.690739,68.7089265 C34.6979157,53.5365341 34.6312757,38.3610657 34.778909,23.1907237 C34.7953127,21.3289043 34.3893212,20.1314346 33.2943746,19.1513138 C32.9160642,18.8047859 32.4516346,18.4931157 31.893909,18.1834958 C24.4425306,14.0692442 17.1264827,9.70688647 9.75097147,5.44705188 C6.80445763,3.73901728 3.84666646,2.05456279 0.885799526,0.36805797 C0.658198127,0.2419545 0.397789602,0.160961191 0,0 L0,100 C0.880673437,99.5140404 1.64549558,99.0998471 2.39698979,98.6702753 C4.13578145,97.6788772 5.850993,96.6556966 7.59901167,95.688904 C8.47660935,95.2029444 8.5432493,94.4237689 8.5432493,93.5697516 C8.53504745,83.0385795 8.52992136,72.5012558 8.5268456,61.9649576 C8.51864375,47.4599903 8.51351766,32.9539979 8.50531582,18.4500559 C8.50531582,17.584761 8.51351766,16.7225418 8.49813913,15.8633982 C8.48173544,14.9683716 8.86824744,14.9396651 9.51516822,15.3364296 C10.2881925,15.8039349 11.0499389,16.2960457 11.8557705,16.6958857 C12.6226432,17.0854734 12.9230358,17.6626785 12.9127837,18.495166 C12.8912539,20.0289115 12.9127837,21.5606066 12.9127837,23.0964024 C12.9127837,45.6986437 12.9076576,68.3029353 12.9209855,90.9051763 C12.9209855,91.3111678 13.1055271,91.7161341 13.2080502,92.1221255 C13.5996883,91.9980726 14.0261843,91.9447604 14.3757883,91.7458657 C16.3913922,90.6150359 18.3670122,89.4042382 20.4061965,88.3215944 C21.3514593,87.8192311 21.6467258,87.161033 21.6333978,86.1511806 C21.5954644,83.2046667 21.6272466,80.2530271 21.6272466,77.3065132 C21.6272466,61.069931 21.6272466,44.8364243 21.6221202,28.5998421 C21.6221202,26.948195 21.562657,25.2985985 21.549329,23.6469514 C21.5442029,23.2788934 21.6087923,22.9087851 21.6621043,22.303899 C23.1148565,23.1261341 24.3359066,23.7433232 25.4677615,24.5040445 C25.7927599,24.7244692 25.9947304,25.3549863 25.9947304,25.8009618 C26.0347142,34.0171623 26.0347142,42.2313126 26.0347142,50.4495637 C26.0295881,61.4913007 26.0213862,72.5412399 26.0183105,83.5891284 C26.0131844,84.6953526 26.2971733,84.8675914 27.2742186,84.310891 C31.3269564,81.9938691 35.3745681,79.6645444 39.413978,77.328043 C46.3414633,73.331693 53.2556207,69.3209896 60.1800306,65.327715 C68.3685501,60.6106276 76.5621957,55.8996914 84.7589168,51.1990076 C86.3111166,50.3070566 86.673023,49.9851342 85.846687,49.3648695 Z"
						id="Path"
					></path>
				</svg>
				<div className="justify-self-start text-body-md">Mixdown</div>
			</div>
			<span className="flex text-xs font-light transition group-hover:translate-x-1">Share your mixes</span>
		</Link>
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
							<span className="text-xs text-muted-foreground">Signed In As:</span>
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
