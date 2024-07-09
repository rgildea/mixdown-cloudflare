// Generated by Wrangler on Tue Jul 09 2024 12:44:44 GMT-0400 (Eastern Daylight Time)
// by running `wrangler types`

interface Env {
	SESSIONS: KVNamespace;
	HONEYPOT_SECRET: "POOH-LIKES-HONEY";
	DATABASE_URL: string;
	DIRECT_URL: string;
	COOKIE_SECRET: string;
	MOCKS: string;
	MODE: string;
	RESEND_API_KEY: string;
	SENTRY_AUTH_TOKEN: string;
	SENTRY_DSN: string;
	SENTRY_ORG: string;
	SENTRY_PROJECT: string;
	STORAGE_BUCKET: R2Bucket;
}
