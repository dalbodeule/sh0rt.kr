import { getQuery } from "h3"
import {domains, records, users} from "~/server/db/schema"
import bcrypt from 'bcryptjs'
import sha256 from "~/server/utils/sha256";
import getDomain from "~/common/getDomain";
import {gte} from "drizzle-orm";
import type {ICloudflareRequests} from "~/server/utils/cloudflare";
import { updateCloudflareRecord} from "~/server/utils/cloudflare";

interface IUpdateDNSQuery {
    username: string,
    password: string,
    hostname: string,
    myip: string,
    type: 'A' | 'AAAA' | undefined
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event) as IUpdateDNSQuery

    const { username, password, hostname, myip, type } = query

    if(!username || !password || !hostname || !myip)
        throw createError({
            statusCode: 400,
            statusMessage: 'missing parameter'
        })

    const db = useDrizzle()

    const user = await db.query.users.findFirst({
        where: eq(users.email, username)
    })

    if(!user || !user.ddns_key) throw createError({
        statusCode: 403,
        statusMessage: 'badauth',
    })


    const isPasswordValid = await bcrypt.compare(await sha256(password), user.ddns_key)
    if(!isPasswordValid)throw createError({
        statusCode: 403,
        statusMessage: 'badauth',
    })

    const [subdomain, tld] = getDomain(hostname)

    const domainBody = await db.query.domains.findFirst({
        where: and(
            eq(domains.domain, subdomain),
            eq(domains.tld, tld),
            gte(domains.expires, new Date())
        )
    })

    if(!domainBody) throw createError({
        status: 403,
        statusMessage: 'dnserr'
    })

    const existingRecords = await db.query.records.findMany({
        where: eq(records.domain, domainBody.id)
    })

    const isARecordSet = existingRecords.find((value) => {
        return value.type == 'A'
    })
    const isAAAARecordSet = existingRecords.find((value) => {
        return value.type == 'AAAA'
    })

    let record: ICloudflareRequests = {
        type: '',
        name: '',
        value: ''
    }
    let recordCfid: string = ''
    let id = 0

    if(type == 'A' || !type) {
        if(!isARecordSet) throw createError({
            status: 403,
            statusMessage: "dnserr"
        })

        record = {
            type: 'A',
            name: `${isARecordSet.name}.${domainBody.domain}`,
            value: myip
        }
        recordCfid = isARecordSet.cfid
        id = isARecordSet.id
    } else if(type == 'AAAA') {
        if(!isAAAARecordSet) throw createError({
            status: 403,
            statusMessage: "dnserr"
        })

        record = {
            type: 'AAAA',
            name: `${isAAAARecordSet.name}.${domainBody.domain}`,
            value: myip
        }
        recordCfid = isAAAARecordSet.cfid
        id = isAAAARecordSet.id
    } else {
        throw createError({
            status: 403,
            statusMessage: "dnserr"
        })
    }

    await updateCloudflareRecord(tld, record, recordCfid);
    await db.update(records).set({ value: record.value }).where(eq(records.id, id));

    return `good ${myip}`
})