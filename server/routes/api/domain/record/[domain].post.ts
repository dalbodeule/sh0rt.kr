import {domains, records} from "~/server/db/schema";
import {gte} from "drizzle-orm";
import type {
    ICloudflareRequests, ICloudflareSRVRequests} from "~/server/utils/cloudflare";
import {
    createCloudflareRecord,
    deleteCloudflareRecord,
    updateCloudflareRecord
} from "~/server/utils/cloudflare";
import getDomain from "~/common/getDomain";
import getLimits from "~/server/utils/getLimits";

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

    const body = await readBody(event) as IRecordPost
    if(!Array.isArray(body)) throw createError({
        status: 403,
        message: 'Body is wrong',
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

    // Create a map of existing records for quick lookup
    const existingRecordMap: Map<string, { readonly id: number, readonly name: string, readonly type: string, readonly value: string, readonly cfid: string }> = new Map();
    for (const record of existingRecords) {
        const key = `${record.name}:${record.type}`;
        existingRecordMap.set(key, {
            id: record.id,
            name: record.name,
            type: record.type,
            value: record.value,
            cfid: record.cfid
        });
    }

    // Process the incoming records and update the map
    const results = [];
    const newRecordMap: Map<string, { readonly id: number, readonly name: string, readonly type: string, readonly value: string, readonly cfid: string }> = new Map();
    for (const record of body) {
        const { type, name, value } = record;
        const key = `${name}:${type}`;
        newRecordMap.set(key, record);

        const existingRecord = existingRecordMap.get(key);

        if (type === 'CNAME') {
            if (existingRecordMap.has(`${name}:A`) || existingRecordMap.has(`${name}:AAAA`)) {
                throw createError({ status: 409, statusMessage: `Conflict: CNAME record cannot coexist with A/AAAA record for name ${name}` });
            }
        } else if (type === 'A' || type === 'AAAA') {
            if (existingRecordMap.has(`${name}:CNAME`)) {
                throw createError({ status: 409, statusMessage: `Conflict: A/AAAA record cannot coexist with CNAME record for name ${name}` });
            }
        }

        const data: ICloudflareRequests = {
            type,
            name,
            value
        }

        if (existingRecord) {
            if (existingRecord.value !== value) {
                await updateCloudflareRecord(`${domain}.space-mc.com`, data, existingRecord.cfid);
                await db.update(records).set({ value }).where(eq(records.id, existingRecord.id));
                results.push({ ...record });
            } else {
                results.push({ ...record });
            }
        } else {
            const limits = await getLimits(event)
            if(!limits[tld]) throw createError({
                status: 403,
                message: 'Limit reached. Contact Administrator.'
            })

            const result = await createCloudflareRecord(`${domain}.space-mc.com`, data);
            await db.insert(records).values({
                domain: domainBody.id,
                type,
                name,
                value,
                cfid: result.result.id
            });
            results.push({ ...record });
        }
    }

    // Identify and delete records that are not in the new record list
    for (const [key, record] of existingRecordMap.entries()) {
        if (!newRecordMap.has(key)) {
            await deleteCloudflareRecord(`${domain}.space-mc.com`, record.cfid);
            await db.delete(records).where(eq(records.id, record.id));
        }
    }

    return results;
})