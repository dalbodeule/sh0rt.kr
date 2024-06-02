import {domains} from "~/server/db/schema";
import {gte} from "drizzle-orm";

export interface IDomainGetResponse {
    id: number,
    domain: string,
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

    const domain = getRouterParam(event, 'domain') ?? ''
    if(!domain) throw createError({
        status: 404,
        message: 'Not found',
    })

    const result = await db.query.domains.findFirst({
        where: and(
            eq(domains.domain, domain),
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

    if(result) {
        const data: IDomainGetResponse = {
            id: result.id,
            domain: result.domain,
            user: {
                id: result.UsersToDomains[0].Users.id,
                name: result.UsersToDomains[0].Users.name,
                profile: result.UsersToDomains[0].Users.profile
            },
            created_at: result.created_at,
            updated_at: result.updated_at,
            expires: result.expires
        }

        return data
    }
    throw createError({
        status: 404,
        message: 'Not found',
    })
})