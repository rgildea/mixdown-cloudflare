import { redirect } from '@remix-run/cloudflare'

export const loader = async () => {
	return redirect('/')
}

export default function Route() {
	return null
}
