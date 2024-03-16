import { type Strategy } from 'remix-auth'
import { type Timings } from '../timing.server.ts'
import { createConnectionSessionStorage } from '../session.server.ts'

// Define a user type for cleaner typing
export type ProviderUser = {
	id: string
	email: string
	username?: string
	name?: string
	imageUrl?: string
}

export interface AuthProvider {
	getAuthStrategy(clientID: string, clientSecret: string): Strategy<ProviderUser, any>
	handleMockAction(
		connectionSessionStorage: ReturnType<typeof createConnectionSessionStorage>,
		request: Request,
	): Promise<void>
	resolveConnectionData(
		providerId: string,
		options?: { timings?: Timings },
	): Promise<{
		displayName: string
		link?: string | null
	}>
}
