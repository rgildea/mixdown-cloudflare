import NewTrackModal from '#app/components/NewTrackModal'
import { ActionFunction, json } from '@remix-run/cloudflare'
import { Outlet, useLocation, useNavigate, useSearchParams } from '@remix-run/react'

export const action: ActionFunction = async () => {
	return json({}, { status: 200 })
}

export default function Route() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const location = useLocation()

	return (
		<>
			<Outlet />
			{searchParams.get('new') === 'true' && (
				<NewTrackModal
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
