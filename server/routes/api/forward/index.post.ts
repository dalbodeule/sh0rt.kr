import type { IUIDGetResponse } from "~/server/routes/api/forward/[uid].get"
import type { H3Event } from "h3";
import {analyticsCache, urls, usersToUrls} from "~/server/db/schema";
import { and, eq, gte } from "drizzle-orm";
import dayjs from "dayjs";
import { useDrizzle } from "~/server/utils/useDrizzle";

export interface IUIDPostRequest {
    uid: string | null,
    forward: string | null,
    expires: string | null
}

export default defineEventHandler(async (event: H3Event) => {
    const user = await requireUserSession(event)

    if(!user) throw createError({
        status: 403,
        statusMessage: "Invalid authentication",
    })

    const request = await readBody(event) as IUIDPostRequest
    if(!request.uid || !request.forward || !request.expires) throw createError({
        status: 403,
        message: 'Body is wrong',
    })

    const db = useDrizzle()

    const result = await db.query.urls.findFirst({
        where: and(
            eq(urls.uid, request.uid),
            gte(urls.expires, new Date())
        )
    })

    if(result) throw createError({
        status: 403,
        statusMessage: "Invalid uid"
    })

    const url_id = await db.insert(urls).values({
        uid: request.uid!,
        forward: request.forward,
        expires: dayjs(request.expires).toDate()
    }).returning()

    await db.insert(usersToUrls).values({ user: user.user.id, url: url_id[0].id})

    const response = await db.query.urls.findFirst({
        where: and(
            eq(urls.uid, request.uid),
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

    await db.delete(analyticsCache).where(
        eq(analyticsCache.uid, request.uid)
    )

    const responseData: IUIDGetResponse = {
        id: response!.id,
        uid: response!.uid,
        forward: response!.forward,
        user: {
            id: response!.UsersToUrls[0].Users.id,
            name: response!.UsersToUrls[0].Users.name,
            profile: response!.UsersToUrls[0].Users.profile
        },
        created_at: response!.created_at,
        updated_at: response!.updated_at,
        expires: response!.expires,
    }

    return responseData
})