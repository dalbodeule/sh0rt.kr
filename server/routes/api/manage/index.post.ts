import type { H3Event } from "h3"
import { useDrizzle } from "~/server/utils/useDrizzle"
import { eq } from 'drizzle-orm/expressions'
import { users } from "~/server/db/schema"

export interface IListUrls {
    [key: number]: {
        id: number,
        uid: string,
        forward: string,
        created_at: string,
        updated_at: string,
        expires: string
    }
}

export default defineEventHandler(async(event: H3Event) => {
    const db = useDrizzle()

    const userSession = await requireUserSession(event)
    if(!userSession.user) throw createError({
        status: 403,
        message: 'Unauthorized',
    })

    const result = await db.query.users.findFirst({
        where: eq(users.id, userSession.user.id),
        with: {
            usersToUrls: {
                with: {
                    Urls: true
                }
            }
        }
    })

    return result?.usersToUrls.map((value) => {
        return value.Urls
    })
})