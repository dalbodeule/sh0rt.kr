import {H3Event} from "h3";
import {getUserSession} from "#imports";


export default defineEventHandler(async (event: H3Event) => {
    const session = await requireUserSession(event)

    if(!session) throw createError({
        statusCode: 403,
        message: 'Unauthorized',
    })

    return session
})