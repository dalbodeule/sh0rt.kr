import type { IUIDGetResponse } from "~/server/routes/api/forward/[uid].get"
import type { H3Event } from "h3";
import {analyticsCache, urls, usersToUrls} from "~/server/db/schema";
import { and, eq, gte } from "drizzle-orm";
import dayjs from "dayjs";
import { useDrizzle } from "~/server/utils/useDrizzle";

export interface IUIDPostRequest {
    uid: string | undefined,
    forward: string | undefined,
    expires: string | undefined,
    token: string | undefined
}

export default defineEventHandler(async (event: H3Event) => {
    const user = await requireUserSession(event)

    if(!user) throw createError({
        status: 403,
        statusMessage: "Invalid authentication",
    })

    const request = await readBody(event) as IUIDPostRequest
    if(!request.uid || !/^[a-zA-Z0-9]{3,20}$/.test(request.uid) || !request.forward || !request.expires || !request.token) throw createError({
        status: 403,
        message: 'Body is wrong',
    })

    const verify = await verifyTurnstileToken(request.token, event)
    if(!verify.success) throw createError({
        status: 403,
        message: 'Captcha is wrong',
    })

    const db = useDrizzle(event.context.cloudflare.env.DB)

    const result = await db.query.urls.findFirst({ where: eq(urls.uid, request.uid) })

    if(result) throw createError({
        status: 403,
        statusMessage: "Invalid uid"
    })

    const expires = dayjs(request.expires).endOf('day')
    if (!expires.isValid() || !expires.isAfter(dayjs())) throw createError({ status: 400, message: 'Invalid expiration date' })

    let parsedForward: URL
    try {
        parsedForward = new URL(request.forward)
        if (!['http:', 'https:'].includes(parsedForward.protocol)) throw new Error('unsupported protocol')
    } catch {
        throw createError({ status: 400, message: 'Invalid forward URL' })
    }

    const url_id = await db.insert(urls).values({
        uid: request.uid!,
        forward: parsedForward.toString(),
        expires: expires.toDate()
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
