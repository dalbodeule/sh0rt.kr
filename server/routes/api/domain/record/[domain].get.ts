import {domains, records} from "~/server/db/schema";
import {gte} from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const user = await requireUserSession(event)

    if (!user) throw createError({
        status: 403,
        statusMessage: "Invalid authentication",
    })

    const domain = getRouterParam(event, 'domain') ?? ''
    if (!domain) throw createError({
        status: 404,
        message: 'Not found',
    })

    const db = useDrizzle()

    const domainBody = await db.query.domains.findFirst({
            where: and(eq(domains.domain, domain),
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
