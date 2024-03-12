import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

const userData: Prisma.UserCreateInput[] = [
	{
		username: 'ryan',
		password: {
			create: {
				hash: await bcrypt.hash('ryanrox', 10),
			}
		}
	},
]

async function main() {
	console.log(`Start seeding ...`)
	for (const u of userData) {
		const user = await prisma.user.create({
			data: u,
		})
		console.log(`Created user with id: ${user.id}`)
	}
	console.log(`Seeding finished.`)
}

main()
	.then(async () => {
		await prisma.$disconnect()
	})
	.catch(async e => {
		console.error(e)
		await prisma.$disconnect()
		process.exit(1)
	})
