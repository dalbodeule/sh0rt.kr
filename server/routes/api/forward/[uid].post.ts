import type {H3Event} from "h3";
import {useDrizzle} from "~/server/utils/useDrizzle";
import {and, eq, gte} from "drizzle-orm";
import { urls } from "~/server/db/schema";
import dayjs from "dayjs";
import type {IUIDGetResponse} from "~/server/routes/api/forward/[uid].get";
import type { IUIDPostRequest } from "~/server/routes/api/forward/index.post";

export default defineEventHandler(async (event: H3Event) => {
    const user = await requireUserSession(event)

    if(!user) throw createError({
        status: 403,
        statusMessage: "Invalid authentication",
    })

    const request = await readBody(event) as IUIDPostRequest
    if(!request.uid || !request.forward || !request.expires || !request.token) throw createError({
        status: 403,
        message: 'Body is wrong',
    })

    let parsedForward: URL
    try {
        parsedForward = new URL(request.forward)
        if (!['http:', 'https:'].includes(parsedForward.protocol)) throw new Error('unsupported protocol')
    } catch {
        throw createError({ status: 400, message: 'Invalid forward URL' })
    }
    const expires = dayjs(request.expires).endOf('day')
    if (!expires.isValid() || !expires.isAfter(dayjs())) throw createError({ status: 400, message: 'Invalid expiration date' })

    const verify = await verifyTurnstileToken(request.token, event)
    if(!verify.success) throw createError({
        status: 403,
        message: 'Captcha is wrong',
    })

    const db = useDrizzle(event.context.cloudflare.env.DB)

    const result = await db.query.urls.findFirst({
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

    if(!result || result.UsersToUrls[0]?.user !== user.user.id) throw createError({
        status: 403,
        statusMessage: "Invalid uid"
    })

    await db.update(urls).set({ forward: parsedForward.toString(), expires: expires.toDate(), updated_at: new Date() })
        .where(eq(urls.id, result.id))

    const responseData: IUIDGetResponse = {
        id: result!.id,
        uid: result!.uid,
        forward: parsedForward.toString(),
        user: {
            id: result!.UsersToUrls[0].Users.id,
            name: result!.UsersToUrls[0].Users.name,
            profile: result!.UsersToUrls[0].Users.profile
        },
        created_at: result!.created_at,
        updated_at: result!.updated_at,
        expires: expires.toDate(),
    }

    return responseData
})
