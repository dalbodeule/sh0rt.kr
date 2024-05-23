import { Miniflare } from 'miniflare'
import {H3Event} from "h3";
import {D1Database$} from "cfw-bindings-wrangler-bridge";

const config = useRuntimeConfig()

/* const mf = new Miniflare({
    modules: true,
    scriptPath: ".output/server/index.mjs",
    d1Databases: {
        DB: config.dbid
    }
}) */

export default async function (event: H3Event) {
    if(process.dev) {
        // return await mf.getD1Database("DB")
        return null
    } else {
        return event.context.cloudflare.env.DB as D1Database$
    }
}