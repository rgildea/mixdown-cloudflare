import { type loader as rootLoader } from '#app/root.tsx'
import { type SerializeFrom } from '@remix-run/cloudflare'
import { useRouteLoaderData } from '@remix-run/react'
import { TrackWithVersions } from './track.server'

function isUser(user: any): user is SerializeFrom<typeof rootLoader>['user'] {
	return user && typeof user === 'object' && typeof user.id === 'string'
}

export function useOptionalUser() {
	const data = useRouteLoaderData<typeof rootLoader>('root')
	if (!data || !isUser(data.user)) {
		return undefined
	}
	return data.user
}

export function useUser() {
	const maybeUser = useOptionalUser()
	if (!maybeUser) {
		throw new Error(
			'No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead.',
		)
	}
	return maybeUser
}

type Action = 'create' | 'read' | 'update' | 'delete'
type Entity = 'user' | 'track'
type Access = 'own' | 'any' | 'own,any' | 'any,own'
export type PermissionString = `${Action}:${Entity}` | `${Action}:${Entity}:${Access}`

export function parsePermissionString(permissionString: PermissionString) {
	const [action, entity, access] = permissionString.split(':') as [Action, Entity, Access | undefined]
	return {
		action,
		entity,
		access: access ? (access.split(',') as Array<Access>) : undefined,
	}
}

export function userHasPermission(
	user: Pick<ReturnType<typeof useUser>, 'roles'> | null | undefined,
	permission: PermissionString,
) {
	if (!user) return false
	const { action, entity, access } = parsePermissionString(permission)
	return user.roles.some(role =>
		role.permissions.some(
			permission =>
				permission.entity === entity && permission.action === action && (!access || access.includes(permission.access)),
		),
	)
}

export function userHasRole(user: Pick<ReturnType<typeof useUser>, 'roles'> | null, role: string) {
	if (!user) return false
	return user.roles.some(r => r.name === role)
}

export function usePermission(permission: PermissionString) {
	const user = useUser()
	return userHasPermission(user, permission)
}

export function useRole(role: string) {
	const user = useUser()
	return userHasRole(user, role)
}

export function usePermissionGuard(permission: PermissionString) {
	const hasPermission = usePermission(permission)
	if (!hasPermission) {
		throw new Error(`User does not have permission: ${permission}`)
	}
}

export function useRoleGuard(role: string) {
	const hasRole = useRole(role)
	if (!hasRole) {
		throw new Error(`User does not have role: ${role}`)
	}
}

export function userOwnsTrack(
	user: Pick<ReturnType<typeof useUser>, 'id' | 'name' | 'username' | 'name'> | null,
	track: Pick<TrackWithVersions, 'creator'>,
) {
	// console.debug(
	// 	`Does ${user?.name ?? user?.username} own ${track.creator.username}'s track? ${user && user.id === track.creator.id}`,
	// )
	return user && user.id === track.creator.id
}
