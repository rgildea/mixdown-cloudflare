import { useUser } from '#app/utils/user'
import { Form, Link, useSubmit } from '@remix-run/react'
import { useRef } from 'react'
import { Button } from './ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Icon } from './ui/icon'

function UserDropdown() {
	const user = useUser()
	const submit = useSubmit()
	const formRef = useRef<HTMLFormElement>(null)
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button asChild variant="default">
					<Link
						to={`/users/${user.username}`}
						// this is for progressive enhancement
						onClick={e => e.preventDefault()}
						className="flex items-center gap-2"
					>
						<Icon className="text-body-md" name="avatar" />
						{/* <img
							className="h-4 w-4 rounded-full object-cover"
							alt={user.name ?? user.username}
							src={getUserImgSrc(user.image?.id)}
						/> */}
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

export { UserDropdown }
