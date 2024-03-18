import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

const userData: Prisma.UserCreateInput[] = [
	{
		email: 'ryangildea@gmail.com',
		password: {
			create: {
				hash: await bcrypt.hash('ryanrox', 10),
			},
		},
	},
]

async function main() {
	console.log(`Start seeding ...`)

	console.time('🔑 Created permissions...')
	const entities = ['user', 'track']
	const actions = ['create', 'read', 'update', 'delete']
	const accesses = ['own', 'any'] as const
	for (const entity of entities) {
		for (const action of actions) {
			for (const access of accesses) {
				await prisma.permission.create({ data: { entity, action, access } })
			}
		}
	}
	console.timeEnd('🔑 Created permissions...')

	console.time('👑 Created roles...')
	await prisma.role.create({
		data: {
			name: 'admin',
			permissions: {
				connect: await prisma.permission.findMany({
					select: { id: true },
					where: { access: 'any' },
				}),
			},
		},
	})
	await prisma.role.create({
		data: {
			name: 'user',
			permissions: {
				connect: await prisma.permission.findMany({
					select: { id: true },
					where: { access: 'own' },
				}),
			},
		},
	})
	console.timeEnd('👑 Created roles...')

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
