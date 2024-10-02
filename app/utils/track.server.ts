import { Prisma } from '@prisma/client'
import { StorageContext } from './auth.server'
import { userBasicSelect } from './user.server'

const trackVersionWithAudioFileSelect = {
	id: true,
	version: true,
	title: true,
	audioFile: {
		select: {
			id: true,
			fileKey: true,
			url: true,
		},
	},
} satisfies Prisma.TrackVersionSelect

const trackWithVersionsSelect = {
	id: true,
	title: true,
	description: true,
	activeTrackVersion: {
		select: trackVersionWithAudioFileSelect,
	},
	creator: {
		select: userBasicSelect,
	},
	trackVersions: {
		select: trackVersionWithAudioFileSelect,
		orderBy: { created_at: 'desc' },
	},
} satisfies Prisma.TrackSelect

export type TrackWithVersions = Prisma.TrackGetPayload<{ select: typeof trackWithVersionsSelect }>
export type TrackVersionWithAudioFile = Prisma.TrackVersionGetPayload<{
	select: typeof trackVersionWithAudioFileSelect
}>

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

export async function updateTrackActiveVersion(storageContext: StorageContext, trackId: string, versionId: string) {
	const { db } = storageContext
	try {
		const updatedTrack = await db.track.update({
			where: { id: trackId },
			data: {
				activeTrackVersion: {
					connect: {
						id: versionId,
					},
				},
			},
			select: trackWithVersionsSelect,
		})

		return updatedTrack
	} catch (error) {
		console.error(error)
		throw new Error('Failed to update track active version')
	}
}

export async function updateTrack(
	storageContext: StorageContext,
	trackId: string,
	title: string,
	description?: string,
) {
	const { db } = storageContext
	try {
		const updatedTrack = await db.track.update({
			where: { id: trackId },
			data: { title, description },
			select: trackWithVersionsSelect,
		})

		return updatedTrack
	} catch (error) {
		console.error(error)
		throw new Error('Failed to update track')
	}
}

export const createTrackWithAudioFile = async (
	storageContext: StorageContext,
	userId: string,
	key: string,
	filename: string,
	contentType: string,
	fileSize: number,
) => {
	const { db } = storageContext
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

		if (!result.version?.track.id || !result.version?.id) {
			throw new Error('Failed to create audio file record')
		}

		const updateResult = updateTrackActiveVersion(storageContext, result?.version?.track.id, result?.version?.id)

		return updateResult
	} catch (error) {
		console.error(error)
		throw new Error('Failed to create audio file record')
	}
}

export const addTrackVersionWithAudioFile = async (
	storageContext: StorageContext,
	userId: string,
	key: string,
	filename: string,
	contentType: string,
	fileSize: number,
	trackId: string,
) => {
	const { db } = storageContext

	await db.track.findFirst({
		select: {
			_count: {
				select: {
					trackVersions: true,
				},
			},
		},
	})

	const trackWithVersionsCountResult = await db.track.findFirst({
		select: {
			_count: {
				select: { trackVersions: true },
			},
		},
		where: {
			id: trackId,
			creatorId: userId,
		},
		orderBy: {
			created_at: 'desc',
		},
	})

	const trackWithVersionsCount = trackWithVersionsCountResult?._count?.trackVersions || 0
	const nextVersion = trackWithVersionsCount + 1

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
						version: nextVersion,
						title: `version ${nextVersion} of ${filename}`,
						track: {
							connect: {
								id: trackId,
								creatorId: userId,
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

		await db.track.update({
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

		return result
	} catch (error) {
		console.error(error)
		throw new Error('Failed to create audio file record')
	}
}
