import { Prisma } from '@prisma/client'

export const userBasicSelect = {
	id: true,
	username: true,
	name: true,
	image: { select: { id: true } },
}

export type BasicUser = Prisma.TrackGetPayload<{ select: typeof userBasicSelect }>

export const userSelect = {
	id: true,
	name: true,
	username: true,
	email: true,
	image: { select: { id: true } },
	roles: {
		select: {
			name: true,
			permissions: {
				select: { entity: true, action: true, access: true },
			},
		},
	},
}

export type basicUser = Prisma.TrackGetPayload<{ select: typeof userSelect }>

export const userWithRolesSelect = {
	...userSelect,
	roles: {
		select: {
			name: true,
			permissions: {
				select: { entity: true, action: true, access: true },
			},
		},
	},
}
