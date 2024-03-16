import { LinksFunction, LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react'

import styles from './styles/tailwind.css?url'
import { getUserId, logout } from './utils/auth.server'
import { getDomainUrl, combineHeaders } from './utils/misc'
import { getToast } from './utils/toast.server'
import { makeTimings, time } from './utils/timing.server.ts'
import { getHints } from './utils/client-hints'
export const links: LinksFunction = () => [{ rel: 'stylesheet', href: styles }]

export async function loader({ context: { storageContext }, request }: LoaderFunctionArgs) {
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
	// const honeyProps = honeypot.getInputProps()

	return json(
		{
			user,
			requestInfo: {
				hints: getHints(request),
				origin: getDomainUrl(request),
				path: new URL(request.url).pathname,
				// userPrefs: {
				// 	theme: getTheme(request),
				// },
			},
			// ENV: getEnv(),
			toast,
			// honeyProps,
		},
		{
			headers: combineHeaders({ 'Server-Timing': timings.toString() }, toastHeaders),
		},
	)
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="bg-background text-foreground">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}

export default function App() {
	return <Outlet />
}
