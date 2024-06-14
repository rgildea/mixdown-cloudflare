import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages'

import { ServerBuild } from '@remix-run/cloudflare'
import * as build from '../build/server'
import { getLoadContext } from '../load-context'

const serverBuild = build as unknown as ServerBuild

export const onRequest = createPagesFunctionHandler({ build: serverBuild, getLoadContext })
