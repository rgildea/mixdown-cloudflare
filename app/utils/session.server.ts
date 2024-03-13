import bcrypt from 'bcryptjs'

export async function login({ db, email, password }) {
	const userWithPassword = await db.user.findUnique({
		where: { email },
		include: { password: { select: { hash: true } } },
	})

	if (!userWithPassword || !userWithPassword.password?.hash) {
		return null
	}

	const passwordMatch = await bcrypt.compare(password, userWithPassword.password.hash)
	if (!passwordMatch) {
		return null
	}
	// Remove the password from the user object before returning it
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { password: _password, ...userWithoutPassword } = userWithPassword
	console.log(userWithoutPassword)
	return userWithoutPassword
}
