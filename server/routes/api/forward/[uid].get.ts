import getDB from "~/server/getDB";
import {drizzle} from "drizzle-orm/d1";
import {Urls} from "~/db/schema";
import {and, eq, gte} from "drizzle-orm";

export interface IUIDGetResponse {
    id: number,
    uid: string,
    forward: string,
    user: number,
    created_at: Date,
    updated_at: Date,
    expires: Date
}

export default defineEventHandler(async (event) => {
    const db = drizzle(await getDB(event))
    const uid = getRouterParam(event, 'uid') ?? ''

    console.log(uid)

    const result = await db.select().from(Urls).where(and(
        eq(Urls.uid, uid),
        gte(Urls.expires, new Date())
    ))

    if(result.length > 0) {
        const data: IUIDGetResponse = {
            id: result[0].id,
            uid: result[0].uid,
            forward: result[0].forward,
            user: result[0].user ?? 0,
            created_at: result[0].created_at,
            updated_at: result[0].updated_at,
            expires: result[0].expires,
        }

        return data
    }
    return null
})