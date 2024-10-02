// Footer.tsx
import { InlineIcon } from '@iconify/react' // Import the InlineIcon component
import { Link } from '@remix-run/react'
import Logo from './Logo'

const Footer: React.FC = () => {
	return (
		<div className="mt-16 items-center">
			<Logo size="sm" className="visible text-foreground" />
			<div className="mt-2 flex w-max items-center text-sm text-muted-foreground">
				<Link to="https://www.ryangildea.com">© {new Date().getFullYear()} Ryan Gildea</Link>
				&nbsp;
				<Link to="https://github.com/rgildea/">
					<InlineIcon className="size-3" icon="mdi:github" />
				</Link>
				&nbsp;
				<Link target="_blank" to="https://www.linkedin.com/in/ryangildea/" rel="noreferrer">
					<InlineIcon className="size-3" icon="mdi:linkedin" />
				</Link>
			</div>
		</div>

	)
}

export default Footer
