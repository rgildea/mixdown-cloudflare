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
export class TrackNotFoundError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'NotFoundError'
	}
}

export async function deleteTrackByAudioFile(storageContext: StorageContext, audioFileKey: string) {
	const { db } = storageContext
	const track = await getTrackByAudioFile(storageContext, audioFileKey)

	if (!track) {
		throw new TrackNotFoundError('Track not found')
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

export async function updateTrack(
	storageContext: StorageContext,
	trackId: string,
	title: string,
	description: string,
	creatorId?: string,
) {
	const { db } = storageContext
	try {
		const where = creatorId ? { id: trackId, creatorId: creatorId } : { id: trackId }

		const updatedTrack = await db.track.update({
			where,
			data: {
				title,
				description,
			},
		})

		return updatedTrack
	} catch (error) {
		console.error(error)
		throw new Error('Failed to update track')
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
		const result = await db.audioFile.create({
			data: {
				contentType,
				fileKey: key,
				fileName: filename,
				fileSize,
				url: `/storage/${key}`,
				version: {
					create: {
						title: `version of ${filename}`,
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
			select: {
				id: true, // id of the audioFile
				version: {
					select: {
						id: true, // id of the version
						track: {
							select: {
								id: true, // id of the track
							},
						},
					},
				},
			},
		})

		return result
	} catch (error) {
		console.error(error)
		throw new Error('Failed to create audio file record')
	}
}
