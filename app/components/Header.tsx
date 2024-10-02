import { ThemeSwitch } from '#app/components/ThemeSwitch'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon'
// import { useTitleContext } from '#app/contexts/TitleContext'
import { loader } from '#app/root'
import { useOptionalUser } from '#app/utils/user'
import { Link, useRouteLoaderData } from '@remix-run/react'
import { UserDropdown } from './UserDropdown'

const Header = () => {
	const data = useRouteLoaderData<typeof loader>('root')

	// Get the title state from the context
	// const titleContext = useTitleContext()
	const user = useOptionalUser()

	const finalTitle = 'Mixdown!'
	const finalIcon = 'mdi:home' //titleContext?.icon ?? null

	return (
		<header className="mx-auto flex h-10 w-full shadow-md">
			<nav className="w-full bg-primary pt-1 text-secondary-foreground">
				<div className="mx-auto flex w-full items-center justify-between">
					<Link className="" to="/">
						<div className="flex items-center font-nourd tracking-wide">
							{finalIcon && <Icon className="mx-1 size-6" name="mixdown-initials" />}
							{finalTitle}
						</div>
					</Link>
					<div className="flex items-center justify-end space-x-1">
						<ThemeSwitch userPreference={data?.requestInfo.userPrefs.theme} />
						{user ? (
							<UserDropdown />
						) : (
							<Button asChild variant="default">
								<Link className="text-secondary-foreground" to="/login">
									Log In
								</Link>
							</Button>
						)}
					</div>
				</div>
			</nav>
		</header>
	)
}

export default Header
