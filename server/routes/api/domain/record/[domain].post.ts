import {domains, records} from "~/server/db/schema";
import {gte} from "drizzle-orm";
import {createCloudflareRecord, updateCloudflareRecord} from "~/server/utils/cloudflare";

export interface IRecordPost { [key: number]: {
        type: string,
        name: string,
        value: string
    }
}

export default defineEventHandler(async (event) => {
    const user = await requireUserSession(event)

    if(!user) throw createError({
        status: 403,
        statusMessage: "Invalid authentication",
    })

    const domain = getRouterParam(event, 'domain') ?? ''
    if(!domain) throw createError({
        status: 404,
        message: 'Not found',
    })

    const body = await readBody(event) as IRecordPost

    if(!Array.isArray(body)) throw createError({
        status: 403,
        message: 'Body is wrong',
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

    const existingRecordMap: Map<string, {id: number, type: string, name: string, value: string, cfid: string}> = new Map()
    for (const record of existingRecords) {
        const key = record.type == 'A' || record.type == 'AAAA' || record.type == 'CNAME'
            ? `${record.name}`
            : `${record.type}:${record.name}`
        existingRecordMap.set(key, record)
    }

    const results = []

    for (const record of body) {
        const key = record.type == 'A' || record.type == 'AAAA' || record.type == 'CNAME'
            ? `${record.name}`
            : `${record.type}:${record.name}`
        const existing = existingRecordMap.get(key)

        if(existing) {
            if(existing.value !== record.value) {
                const result = await updateCloudflareRecord(`${domain}.space-mc.com`, record.type, record.name, record.value, existing.cfid)
                await db.update(records).set({
                    value: record.value,
                }).where(eq(records.cfid, existing.cfid))
            }
            results.push( record )
        } else {
            const result = await createCloudflareRecord(`${domain}.space-mc.com`, record.type, record.name, record.value)

            await db.insert(records).values({
                domain: domainBody.id,
                type: record.type,
                name: record.name,
                value: record.value,
                cfid: result.result.id
            })
            results.push( record )
        }
    }

    return results
})