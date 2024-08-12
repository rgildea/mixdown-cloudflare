import { Prisma, PrismaClient } from '@prisma/client'
import { StorageContext } from './auth.server'

const trackWithVersionsSelect = Prisma.validator<Prisma.TrackSelect>()({
	id: true,
	title: true,
	description: true,
	activeTrackVersion: {
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
	},
	creator: {
		select: {
			id: true,
			username: true,
			image: undefined,
		},
	},
	trackVersions: {
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

// this creates the track via creating a track version
export async function createTrack(storageContext: StorageContext, userId: string, title: string) {
	const { db } = storageContext
	const trackVersion = await db.trackVersion.create({
		data: {
			title,
			track: {
				create: {
					title,
					creator: {
						connect: {
							id: userId,
						},
					},
				},
			},
		},
	})

	const track = db.track.update({
		where: {
			id: trackVersion.trackId,
		},
		data: {
			activeTrackVersion: {
				connect: {
					id: trackVersion.id,
				},
			},
		},
		select: trackWithVersionsSelect,
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
			trackVersions: {
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
	description?: string,
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
						version: 1,
						title: `version 1 of ${filename}`,
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
								activeTrackVersion: {
									select: {
										id: true, // id of the active version
									},
								},
							},
						},
					},
				},
			},
		})

		const updateResult = await db.track.update({
			where: {
				id: result?.version?.track.id,
			},
			data: {
				activeTrackVersion: {
					connect: {
						id: result?.version?.id,
					},
				},
			},
		})

		console.log('Update Result', updateResult)

		return result
	} catch (error) {
		console.error(error)
		throw new Error('Failed to create audio file record')
	}
}
