import { users } from "~/server/db/schema"

export default defineEventHandler(async (event) => {
    const user = await requireUserSession(event)
    if (!user) throw createError({
        status: 403,
        statusMessage: "Invalid authentication",
    })

    const db = useDrizzle()

    const userDB = await db.query.users.findFirst({
        where: eq(users, user.user.id)
    })

    if(!userDB?.ddns_key) throw createError({
        statusCode: 404,
        statusMessage: 'DDNS Key is not created'
    })
    return ''
})