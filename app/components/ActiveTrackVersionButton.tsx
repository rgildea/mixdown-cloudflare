import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { useFetcher } from '@remix-run/react'

interface ActiveTrackVersionButtonProps {
	track: TrackWithVersions
	versionId: string
}

export default function ActiveTrackVersionButton({ track, versionId }: ActiveTrackVersionButtonProps) {
	const checked = track.activeTrackVersion?.id === versionId
	const fetcher = useFetcher()
	const icon = `mdi:star${checked ? '' : '-outline'}`

	return (
		<fetcher.Form method="post">
			<input type="hidden" name="_action" value="set-active" />
			<input type="hidden" name="trackId" value={track.id} />
			<input type="hidden" name="activeTrackVersionId" value={versionId} />
			<input
				type="button"
				className="m-0 hidden size-5 appearance-none"
				onClick={e => {
					e.currentTarget.form?.submit()
				}}
			/>
			<InlineIcon
				className="duration-250 size-4 transition-all ease-in-out checked:bg-secondary hover:scale-[200%]"
				icon={icon}
			/>
		</fetcher.Form>
	)
}
