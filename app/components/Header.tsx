import { ThemeSwitch } from '#app/components/ThemeSwitch'
import { Button } from '#app/components/ui/button'
import { CardTitle } from '#app/components/ui/card'
import { Icon } from '#app/components/ui/icon'
import { useTitleContext } from '#app/contexts/TitleContext'
import { loader } from '#app/root'
import { useOptionalUser } from '#app/utils/user'
import { Link, useRouteLoaderData } from '@remix-run/react'
import { UserDropdown } from './UserDropdown'

const Header = () => {
	const data = useRouteLoaderData<typeof loader>('root')

	// Get the title state from the context
	const titleContext = useTitleContext()
	const user = useOptionalUser()

	// Use the context title if the title is not provided
	const finalTitle = titleContext?.title ?? 'Mixdown'
	const finalIcon = titleContext?.icon ?? null

	return (
		<header className="mx-auto h-8 w-full">
			<nav className="flex shrink-0 grow-0 justify-between align-top">
				<Link className="" to="/">
					<CardTitle className="flex flex-nowrap items-center font-nourd text-2xl font-normal tracking-wide text-card-foreground">
						{finalIcon && <Icon name="mixdown-initials" />}
						{finalTitle}
					</CardTitle>
				</Link>
				<div className="col-span-1 flex justify-end space-x-1">
					<ThemeSwitch userPreference={data?.requestInfo.userPrefs.theme} />
					{user ? (
						<UserDropdown />
					) : (
						<Button asChild variant="default" className="size-7">
							<Link to="/login">Log In</Link>
						</Button>
					)}
				</div>
				{/* <div className="block w-full sm:hidden">{searchBar}</div> */}
			</nav>
		</header>
	)
}

export default Header
