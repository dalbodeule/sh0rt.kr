import {domains, records} from "~/server/db/schema";
import {gte} from "drizzle-orm";
import getDomain from "~/common/getDomain";

export default defineEventHandler(async (event) => {
    const user = await requireUserSession(event)

    if (!user) throw createError({
        status: 403,
        statusMessage: "Invalid authentication",
    })

    const fullDomain = getRouterParam(event, 'domain') ?? ''
    if (!fullDomain) throw createError({
        status: 404,
        message: 'Not found',
    })

    const [domain, tld] = getDomain(fullDomain)

    const db = useDrizzle()

    const domainBody = await db.query.domains.findFirst({
            where: and(
                eq(domains.domain, domain),
                eq(domains.tld, tld),
                gte(domains.expires, new Date())
            )
        }
    )

    if(!domainBody) throw createError({
        status: 403,
        statusMessage: "Invalid domain"
    })

    const existingRecords = await db.query.records.findMany({
        where: eq(records.domain, domainBody.id)
    })

    const results: { name: string, type: string, value: string }[] = []

    existingRecords.forEach((value) => {
        results.push({ name: value.name, type: value.type, value: value.value })
    })

    return results
})
