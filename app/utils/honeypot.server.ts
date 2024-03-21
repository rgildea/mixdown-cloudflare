import { Honeypot, SpamError } from 'remix-utils/honeypot/server'

let honeypot: Honeypot

export function createHoneypot(HONEYPOT_SECRET: string): Honeypot {
	honeypot = new Honeypot({
		validFromFieldName: undefined, //process.env.TESTING ? null : undefined,
		encryptionSeed: HONEYPOT_SECRET,
	})
	return honeypot
}

export function getHoneypot(HONEYPOT_SECRET: string): Honeypot {
	honeypot !== undefined ? honeypot : createHoneypot(HONEYPOT_SECRET)
	return honeypot
}

export function checkHoneypot(formData: FormData, HONEYPOT_SECRET: string) {
	try {
		getHoneypot(HONEYPOT_SECRET).check(formData)
	} catch (error) {
		if (error instanceof SpamError) {
			throw new Response('Form not submitted properly', { status: 400 })
		}
		throw error
	}
}
