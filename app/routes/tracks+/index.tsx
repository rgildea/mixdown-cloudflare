import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardTitle } from '#app/components/ui/card'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { Link, useLoaderData, useMatches } from '@remix-run/react'
import TrackList from '#app/components/TrackList'
import { TrackWithVersions } from '#app/utils/track.server'
import { loader } from './$id'

export default function Route() {
	const matches = useMatches()
	console.log(matches)
	console.log(matches)

	const { tracks } = useLoaderData<typeof loader>() as { tracks: TrackWithVersions[] }

	return (
		<Card className="flex flex-col space-y-4 p-2 sm:w-3/4">
			<CardTitle className="">
				<div>My Tracks</div>
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
			<CardContent>
				<TrackList tracks={tracks} />
			</CardContent>
		</Card>
	)
}
