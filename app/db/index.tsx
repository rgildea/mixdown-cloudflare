import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

export const prisma = new PrismaClient().$extends(withAccelerate())

export const getPrismaClient = (databaseurl: string) => {
	return new PrismaClient({
		datasources: {
			db: {
				url: databaseurl,
			},
		},
	}).$extends(withAccelerate())
}
