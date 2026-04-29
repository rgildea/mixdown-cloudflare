import { execaCommand } from 'execa'
import fsExtra from 'fs-extra'
import path from 'node:path'

export const BASE_DATABASE_PATH = path.join(process.cwd(), `./tests/prisma/base.db`)

export async function setup() {
	const databaseExists = await fsExtra.pathExists(BASE_DATABASE_PATH)
	if (databaseExists && !process.env.DATABASE_URL) return

	const databaseUrl = process.env.DATABASE_URL ?? `file:${BASE_DATABASE_PATH}`
	const packagedSchemaPath = path.join(process.cwd(), 'node_modules/@rgildea/mixdown-database/prisma/schema.prisma')
	const generatedSchemaPath = path.join(process.cwd(), 'node_modules/.prisma/client/schema.prisma')
	const schemaPath = (await fsExtra.pathExists(packagedSchemaPath)) ? packagedSchemaPath : generatedSchemaPath

	await execaCommand(
		`prisma migrate reset --force --skip-seed --skip-generate --schema=${schemaPath}`,
		{ stdio: 'inherit', env: { ...process.env, DATABASE_URL: databaseUrl } },
	)
}
