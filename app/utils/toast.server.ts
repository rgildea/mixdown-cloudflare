import { createId as cuid } from '@paralleldrive/cuid2'
import { SessionStorage, redirect } from '@remix-run/cloudflare'
import { z } from 'zod'
import { combineHeaders } from './misc.tsx'
import { createToastSessionStorage } from './session.server.ts'
export const toastKey = 'toast'

const ToastSchema = z.object({
	description: z.string(),
	id: z.string().default(() => cuid()),
	title: z.string().optional(),
	type: z.enum(['message', 'success', 'error']).default('message'),
})

export type Toast = z.infer<typeof ToastSchema>
export type ToastInput = z.input<typeof ToastSchema>

export async function redirectWithToast(
	toastSessionStorage: ReturnType<typeof createToastSessionStorage>,
	url: string,
	toast: ToastInput,
	init?: ResponseInit,
) {
	return redirect(url, {
		...init,
		headers: combineHeaders(init?.headers, await createToastHeaders(toastSessionStorage, toast)),
	})
}

export async function createToastHeaders(toastSessionStorage: SessionStorage, toastInput: ToastInput) {
	const session = await toastSessionStorage.getSession()
	const toast = ToastSchema.parse(toastInput)
	session.flash(toastKey, toast)
	const cookie = await toastSessionStorage.commitSession(session)
	return new Headers({ 'set-cookie': cookie })
}

export async function getToast(toastSessionStorage: SessionStorage, request: Request) {
	const session = await toastSessionStorage.getSession(request.headers.get('cookie'))
	const result = ToastSchema.safeParse(session.get(toastKey))
	const toast = result.success ? result.data : null
	return {
		toast,
		headers: toast
			? new Headers({
					'set-cookie': await toastSessionStorage.destroySession(session),
				})
			: null,
	}
}
