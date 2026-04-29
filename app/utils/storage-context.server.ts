import { PrismaClient } from '@prisma/client'
import { StorageContext } from './auth.server'
import {
	createAuthSessionStorage,
	createConnectionSessionStorage,
	createToastSessionStorage,
	createVerificationSessionStorage,
} from './session.server'

export const createStorageContext = (
	cookieSecret: string,
	mode: string,
	sessions: KVNamespace,
	db: PrismaClient,
): StorageContext => {
	return {
		authSessionStorage: createAuthSessionStorage(cookieSecret, mode, sessions),
		verificationSessionStorage: createVerificationSessionStorage(cookieSecret, mode, sessions),
		toastSessionStorage: createToastSessionStorage(cookieSecret, mode, sessions),
		connectionSessionStorage: createConnectionSessionStorage(cookieSecret, mode, sessions),
		db,
	}
}
