import {H3Event} from "h3";
import {useDrizzle} from "~/server/utils/useDrizzle";
import {and, eq, gte} from "drizzle-orm";
import {analyticsCache, domains, urls, usersToDomains, usersToUrls} from "~/server/db/schema";
import dayjs from "dayjs";
import {IDomainGetResponse} from "~/server/routes/api/domain/[domain].get";

export interface IDomainPostRequest {
    domain: string | null,
    expires: string | null
}

export default defineEventHandler(async (event: H3Event) => {
    const user = await requireUserSession(event)

    if(!user) throw createError({
        status: 403,
        statusMessage: "Invalid authentication",
    })

    const request = await readBody(event) as IDomainPostRequest
    if(!request.domain || !request.expires) throw createError({
        status: 403,
        message: 'Body is wrong',
    })

    const db = useDrizzle()

    const result = await db.query.domains.findFirst({
        where: and(
            eq(domains.domain, request.domain),
            gte(domains.expires, new Date())
        )
    })

    if(result) throw createError({
        status: 403,
        statusMessage: "Invalid uid"
    })

    const domain_id = await db.insert(domains).values({
        domain: request.domain!!,
        expires: dayjs(request.expires).toDate()
    }).returning()

    await db.insert(usersToDomains).values({ user: user.user.id, domain: domain_id[0].id})

    const response = await db.query.domains.findFirst({
        where: and(
            eq(domains.domain, request.domain),
            gte(domains.expires, new Date())
        ),
        with: {
            UsersToDomains: {
                with: {
                    Users: true
                }
            }
        }
    })

    const responseData: IDomainGetResponse = {
        id: response!!.id,
        domain: response!!.domain,
        user: {
            id: response!!.UsersToDomains[0].Users.id,
            name: response!!.UsersToDomains[0].Users.name,
            profile: response!!.UsersToDomains[0].Users.profile
        },
        created_at: response!!.created_at,
        updated_at: response!!.updated_at,
        expires: response!!.expires,
    }

    return responseData
})