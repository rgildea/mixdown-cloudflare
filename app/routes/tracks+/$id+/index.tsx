import { redirect } from 'react-router'

export const loader = async () => {
	return redirect('versions')
}

export default function Route() {
	return null
}
