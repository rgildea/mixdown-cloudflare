import TrackList from '#app/components/TrackList'
import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardTitle } from '#app/components/ui/card'
import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { ActionFunction, json } from '@remix-run/cloudflare'
import { Link, useMatches, useRouteLoaderData } from '@remix-run/react'
import { loader } from '#app/routes/_dashboard+/_layout'
export const action: ActionFunction = async () => {
	return json({}, { status: 200 })
}

export default function Route() {
	const matches = useMatches()
	// console.log('Route _dashboard+_index.tsx')
	// console.log('Route matches:', matches)

	const match = matches.find(match => match.id == 'routes/_dashboard+/_layout')
	const loaderData = useRouteLoaderData<typeof loader>(match?.id ?? '') as { tracks: TrackWithVersions[] }

	const { tracks } = loaderData
	return (
		<Card className="mt-2 w-full border-none">
			<CardTitle>
				<div className="text-4xl font-extrabold">My Tracks</div>
				<Button
					className="my-2 bg-secondary text-button text-secondary-foreground"
					asChild
					variant="default"
					size="icon"
				>
					<Link to="/tracks/?new=true">
						<InlineIcon className="size-4" icon="akar-icons:cloud-upload" />
					</Link>
				</Button>
			</CardTitle>
			<CardContent className="px-0">
				<TrackList tracks={tracks || []} />
			</CardContent>
		</Card>
	)
}
