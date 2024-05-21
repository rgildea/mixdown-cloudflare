import { TrackWithVersions } from '#app/utils/track.server'
import { InlineIcon } from '@iconify/react/dist/iconify.js'
import { Form, NavLink } from '@remix-run/react'
import { Card } from './ui/card'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { Button } from './ui/button'

interface TrackListProps {
	tracks: TrackWithVersions[]
	setURL: (url: string) => void
	onTrackDeleted: (track: TrackWithVersions) => void
}

function TrackList({ tracks, setURL, onTrackDeleted }: TrackListProps) {
	return (
		<Card
			style={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-around',
			}}
		>
			{/* <ScrollArea.Root className="max-h-96 rounded bg-white shadow-gray-800"> */}
			<ScrollArea.Root>
				<ScrollArea.Viewport className="h-96">
					<div className="px-5 py-[15px]">
						{tracks &&
							tracks.map((track, index) => {
								const audioFile = track.versions[0]?.audioFile
								const trackUrl = `/storage/${audioFile?.fileKey}`
								return (
									trackUrl && (
										<Form key={track.id} method="DELETE" action={trackUrl}>
											<NavLink to={track.id}>
												<div
													className="space-between mt-1 flex w-full items-center justify-center border-t pt-1 align-middle"
													role="button"
													onKeyDown={e => e.key === 'Enter' && setURL(trackUrl)}
													tabIndex={index + 1}
												>
													<Button
														variant="ghost"
														onClick={e => {
															e.stopPropagation()
															setURL(trackUrl)
														}}
													>
														<InlineIcon className="size-5" icon="akar-icons:play"></InlineIcon>
													</Button>
													<span>{track.title}</span>
													<Button
														className=" ml-auto text-button"
														type="submit"
														variant="ghost"
														onClick={e => {
															e.stopPropagation()
															onTrackDeleted(track)
														}}
														onSubmit={e => {
															e.preventDefault()
														}}
													>
														<InlineIcon className="size-5" icon="akar-icons:cross" />
													</Button>
												</div>
											</NavLink>
										</Form>
									)
								)
							})}
					</div>
				</ScrollArea.Viewport>
				<ScrollArea.Scrollbar
					className="duration-[160ms] flex touch-none select-none bg-transparent p-0.5 transition-colors ease-out hover:bg-secondary-foreground data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col"
					orientation="vertical"
				>
					<ScrollArea.Thumb className="relative flex-1 rounded-[10px] bg-accent-foreground before:absolute before:left-1/2 before:top-1/2 before:h-full before:min-h-[44px] before:w-full before:min-w-[44px] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']" />
				</ScrollArea.Scrollbar>

				<ScrollArea.Scrollbar
					className="duration-[300ms] flex touch-none select-none bg-transparent p-0.5 transition-colors ease-out hover:bg-secondary-foreground data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col"
					orientation="horizontal"
				>
					<ScrollArea.Thumb className="relative flex-1 rounded-[10px] bg-gray-800 before:absolute before:left-1/2 before:top-1/2 before:h-full before:min-h-[44px] before:w-full before:min-w-[44px] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']" />
				</ScrollArea.Scrollbar>
			</ScrollArea.Root>
		</Card>
	)
}

export default TrackList
