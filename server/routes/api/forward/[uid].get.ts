import { urls } from "~/server/db/schema";
import { and, eq, gte } from "drizzle-orm";
import { useDrizzle } from "~/server/utils/useDrizzle";

export interface IUIDGetResponse {
    id: number,
    uid: string,
    forward: string,
    user: {
        id: number,
        name: string,
        profile: string
    },
    created_at: Date,
    updated_at: Date,
    expires: Date
}

export default defineEventHandler(async (event) => {
    const db = useDrizzle()

    const uid = getRouterParam(event, 'uid') ?? ''
    if(!uid) throw createError({
        status: 404,
        message: 'Not found',
    })

    const result = await db.query.urls.findFirst({
        where: and(
            eq(urls.uid, uid),
            gte(urls.expires, new Date())
        ),
        with: {
            UsersToUrls: {
                with: {
                    Users: true
                }
            }
        }
    })

    if(result) {
        const data: IUIDGetResponse = {
            id: result.id,
            uid: result.uid,
            forward: result.forward,
            user: {
                id: result.UsersToUrls[0].Users.id,
                name: result.UsersToUrls[0].Users.name,
                profile: result.UsersToUrls[0].Users.profile
            },
            created_at: result.created_at,
            updated_at: result.updated_at,
            expires: result.expires,
        }

        return data
    }
    throw createError({
        status: 404,
        message: 'Not found',
    })
})