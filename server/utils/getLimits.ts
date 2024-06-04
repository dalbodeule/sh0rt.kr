import { domains, records } from "~/server/db/schema"
import { count } from "drizzle-orm"
import type { H3Event } from "h3"

export interface IDomainLimits { [key: string]: number }

const getLimits = async (event: H3Event) => {
    const config = useRuntimeConfig(event)
    const db = useDrizzle()

    const domainList = config.public.domainList.split(',')
    const limitList = config.public.domainLimit.split(',').map((value) => parseInt(value))

    const results: IDomainLimits = {}

    for (const domain of domainList) {
        const idx = domainList.indexOf(domain);
        const domainRes = await db.query.domains.findFirst({ where: eq(domains.tld, domain)})
        if(domainRes) {
            const countRes = await db.select({count: count()}).from(records).where(eq(records.domain, domainRes?.id))

            results[domain] = limitList[idx] - countRes[0].count
        } else
            results[domain] = limitList[idx]
    }

    return results
}

export default getLimits