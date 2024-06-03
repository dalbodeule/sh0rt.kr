import {domains} from "~/server/db/schema";
import {gte} from "drizzle-orm";
import getDomain from "~/common/getDomain";

export interface IDomainGetResponse {
    id: number,
    domain: string,
    tld: string,
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

    const fullDomain = getRouterParam(event, 'domain') ?? ''
    if(!fullDomain) throw createError({
        status: 404,
        message: 'Not found',
    })
    const [domain, tld] = getDomain(fullDomain)

    const result = await db.query.domains.findFirst({
        where: and(
            eq(domains.domain, domain),
            eq(domains.tld, tld),
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
            tld: result.tld,
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