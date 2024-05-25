import {H3Event} from "h3";
import {drizzle} from "drizzle-orm/d1";
import * as schema from '~/db/schema'


export default function (event: H3Event) {
    const { cloudflare } = event.context

    return drizzle(cloudflare.env.DB, {schema})
}