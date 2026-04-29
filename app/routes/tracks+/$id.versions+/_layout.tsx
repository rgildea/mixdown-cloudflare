import NewVersionModal from '#app/components/NewVersionModal.tsx'
import { ActionFunction, data as jsonResponse } from 'react-router'
import { Outlet, useLocation, useNavigate, useRouteLoaderData, useSearchParams } from 'react-router'
import { loader } from '../$id.tsx'

export const action: ActionFunction = async () => {
	return jsonResponse({}, { status: 200 })
}

export default function Route() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const location = useLocation()
	const data = useRouteLoaderData<typeof loader>('routes/tracks+/$id')

	return (
		<>
			<Outlet />
			{searchParams.get('new') === 'true' && (
				<NewVersionModal
					track={data?.track}
					isModalOpen={true}
					setIsModalOpen={() => {
						// nothing
					}}
					onDismiss={() => {
						navigate(location.pathname, { replace: true })
					}}
				/>
			)}
		</>
	)
}
