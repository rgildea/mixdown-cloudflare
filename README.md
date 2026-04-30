# Mixdown Cloudflare

React Router v7 app deployed as a Cloudflare Worker.

## Typegen

Generate types for your Cloudflare bindings in `wrangler.toml`:

```sh
npm run typegen
```

You will need to rerun typegen whenever you make changes to `wrangler.toml`.

## Development

Run the app in development mode:

```sh
npm run dev
```

Run the Worker runtime locally:

```sh
npm run build
npm run start
```

## Deployment

Build the app for production:

```sh
npm run build
```

Deploy to Cloudflare Workers:

```sh
npm run deploy
```
