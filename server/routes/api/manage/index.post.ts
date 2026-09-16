import type { H3Event } from "h3"
import { useDrizzle } from "~/server/utils/useDrizzle"
import { eq } from 'drizzle-orm'
import { users } from "~/server/db/schema"
import { requireActiveUser } from '~/server/utils/requireRole'

export interface IListUrl {
    id: number,
    uid: string,
    manage_id: string,
    forward: string,
    created_at: Date,
    updated_at: Date,
    expires: Date
}

export default defineEventHandler(async(event: H3Event) => {
    const db = useDrizzle(event.context.cloudflare.env.DB)

    const activeUser = await requireActiveUser(event)

    const result = await db.query.users.findFirst({
        where: eq(users.id, activeUser.id),
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
