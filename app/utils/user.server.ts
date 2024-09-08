export const userBasicSelect = {
	id: true,
	username: true,
	image: { select: { id: true } },
}

export const UserSelect = {
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

export const UserWithRolesSelect = {
	...UserSelect,
	roles: {
		select: {
			name: true,
			permissions: {
				select: { entity: true, action: true, access: true },
			},
		},
	},
}
