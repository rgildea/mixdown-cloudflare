import * as Sentry from "@sentry/remix";

Sentry.init({
    dsn: "https://024239230859a77960483b8dbc41ee81@o4506748231614464.ingest.us.sentry.io/4506748353314816",
    tracesSampleRate: 1,
    autoInstrumentRemix: true
})