import { LoaderFunction } from 'react-router'
import { Outlet } from 'react-router'

export const loader: LoaderFunction = async () => {
	return { message: 'This is a message from the loader.' }
}

export default function Route() {
	return (
		<div>
			<Outlet />
		</div>
	)
}
