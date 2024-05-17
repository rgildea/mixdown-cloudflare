import { Prisma, PrismaClient } from '@prisma/client/edge'
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

	const tracks: TrackWithVersions[] = await db.track.findMany({
		select: trackWithVersionsSelect,
		where: { creatorId: userId },
		orderBy: { created_at: 'desc' },
	})
	return tracks
}

export async function getUserTracksWithoutVersions(storageContext: StorageContext, userId: string) {
	const { db } = storageContext
	if (!userId) return null

	const tracks = await db.track.findMany({
		select: {
			id: true,
			title: true,
		},
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

export const createAudioFileRecord = async (
	db: PrismaClient,
	userId: string,
	key: string,
	filename: string,
	contentType: string,
	fileSize: number,
) => {
	try {
		console.log(`createAudioFileRecord for ${filename} called`)
		const result = await db.audioFile.create({
			data: {
				contentType,
				fileKey: key,
				fileName: filename,
				fileSize,
				url: `/storage/${key}`,
				version: {
					create: {
						title: `filename version 1}`,
						version: 1,
						track: {
							create: {
								title: filename,
								creator: {
									connect: {
										id: userId,
									},
								},
							},
						},
					},
				},
			},
		})
		console.log('Audio file record created')
		console.log('Result:', result)
		return result
	} catch (error) {
		console.error(error)
		throw new Error('Failed to create audio file record')
	}
}
