import NewVersionModal from '#app/components/NewVersionModal.tsx'
import { loader } from '#app/routes/tracks+/$id'
import { ActionFunction, json } from '@remix-run/cloudflare'
import { Outlet, useLocation, useNavigate, useRouteLoaderData, useSearchParams } from '@remix-run/react'

export const action: ActionFunction = async () => {
	return json({}, { status: 200 })
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
