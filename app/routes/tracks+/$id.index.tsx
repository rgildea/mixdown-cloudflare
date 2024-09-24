import { redirect } from '@remix-run/react'

//action goes here

export const loader = async () => {
	return redirect('versions')
}

export default function Route() {
	//
}
