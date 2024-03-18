import { type ProviderName } from './connections.tsx'
import { type AuthProvider } from './providers/provider.ts'
import { createConnectionSessionStorage } from './session.server.ts'
import { type Timings } from './timing.server.ts'

export const providers: Record<ProviderName, AuthProvider> = {
	none: {} as AuthProvider,
}

export function handleMockAction(
	connectionSessionStorage: ReturnType<typeof createConnectionSessionStorage>,
	providerName: ProviderName,
	request: Request,
) {
	return providers[providerName].handleMockAction(connectionSessionStorage, request)
}

export function resolveConnectionData(providerName: ProviderName, providerId: string, options?: { timings?: Timings }) {
	return providers[providerName].resolveConnectionData(providerId, options)
}
