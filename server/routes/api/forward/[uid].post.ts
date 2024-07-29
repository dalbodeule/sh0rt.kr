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

    const verify = await verifyTurnstileToken(request.token)
    if(!verify.success) throw createError({
        status: 403,
        message: 'Captcha is wrong',
    })

    const db = useDrizzle()

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

    if(!result) throw createError({
        status: 403,
        statusMessage: "Invalid uid"
    })

    await db.update(urls).set({ forward: request.forward, expires: dayjs(request.expires).toDate() })
        .where(eq(urls.id, result.id))

    const responseData: IUIDGetResponse = {
        id: result!.id,
        uid: result!.uid,
        forward: request.forward,
        user: {
            id: result!.UsersToUrls[0].Users.id,
            name: result!.UsersToUrls[0].Users.name,
            profile: result!.UsersToUrls[0].Users.profile
        },
        created_at: result!.created_at,
        updated_at: result!.updated_at,
        expires: dayjs(request.expires).toDate(),
    }

    return responseData
})