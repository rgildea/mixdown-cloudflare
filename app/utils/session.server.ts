import bcrypt from 'bcryptjs'

export async function login(db, username: string, password: string) {
	const userWithPassword = db.user.findUnique({
		where: {
			username,
			password: await bcrypt.hash(password, 10),
		},
	})

	return userWithPassword
}
