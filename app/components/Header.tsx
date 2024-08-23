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
		<header className="container mt-1 h-12 shrink-0 grow-0 pb-0  ">
			<nav className="flex items-center justify-between">
				<Link className="" to="/">
					<CardTitle className="flex flex-nowrap items-center text-4xl text-card-foreground">
						{finalIcon && <Icon name="mixdown-initials" />}
						{finalTitle}
					</CardTitle>
				</Link>
				<div className="col-span-1 flex justify-end space-x-1">
					<ThemeSwitch userPreference={data?.requestInfo.userPrefs.theme} />
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
	)
}

export default Header
