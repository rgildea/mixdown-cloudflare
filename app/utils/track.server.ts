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

export async function createTrack(storageContext: StorageContext, userId: string, title: string) {
	const { db } = storageContext
	const track = await db.track.create({
		data: {
			title,
			creatorId: userId,
			versions: {
				create: {
					title: `${title} version 1`,
					version: 1,
				},
			},
		},
	})
	return track
}

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

export async function getTrackWithVersionsByTrackId(storageContext: StorageContext, trackId: string) {
	const { db } = storageContext
	const track = await db.track.findFirst({
		select: trackWithVersionsSelect,
		where: {
			id: trackId,
		},
	})

	if (!track) {
		throw new Error('Track not found')
	}
	return track
}

export async function getTrackByAudioFile(storageContext: StorageContext, audioFileKey: string) {
	const { db } = storageContext
	const track = await db.track.findFirst({
		select: trackWithVersionsSelect,
		where: {
			versions: {
				some: {
					audioFile: {
						fileKey: audioFileKey,
					},
				},
			},
		},
	})

	// if (!track) {
	// 	throw new Error('Track not found')
	// }
	return track
}

export async function deleteTrackByAudioFile(storageContext: StorageContext, audioFileKey: string) {
	const { db } = storageContext
	const track = await getTrackByAudioFile(storageContext, audioFileKey)

	if (!track) {
		throw new Error('Track not found')
	}

	try {
		await db.track.delete({
			where: {
				id: track.id,
			},
		})

		return track
	} catch (error) {
		console.error(error)
		throw new Error('Failed to delete track')
	}
}

export async function deleteTrackById(storageContext: StorageContext, trackId: string) {
	const { db } = storageContext

	try {
		const deletedTrack = await db.track.delete({
			where: {
				id: trackId,
			},
		})

		return deletedTrack
	} catch (error) {
		console.error(error)
		throw new Error('Failed to delete track')
	}
}
