import { Prisma } from '@prisma/client'
import { StorageContext } from './auth.server'

const trackWithVersionsSelect = Prisma.validator<Prisma.TrackSelect>()({
	id: true,
	title: true,
	versions: {
		select: {
			id: true,
			title: true,
			version: true,
			audioFile: {
				select: {
					fileKey: true,
					url: true,
				},
			},
		},
		orderBy: { version: 'desc' },
	},
})

export type TrackWithVersions = Prisma.TrackGetPayload<{ select: typeof trackWithVersionsSelect }>

export async function getUserTracksWithVersionInfo(storageContext: StorageContext, userId: string) {
	const { db } = storageContext
	if (!userId) return null

	const tracks = await db.track.findMany({
		select: trackWithVersionsSelect,
		where: { creatorId: userId },
		orderBy: { created_at: 'desc' },
	})
	return tracks
}
