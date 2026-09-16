import { count, sql } from 'drizzle-orm'
import { reports, urls, users, UserRole } from '~/server/db/schema'
import { useDrizzle } from '~/server/utils/useDrizzle'
import { requireRole } from '~/server/utils/requireRole'

export default defineEventHandler(async (event) => {
    await requireRole(event, UserRole.MODERATOR)
    const db = useDrizzle(event.context.cloudflare.env.DB)
    const [userCount, urlCounts, reportCounts] = await Promise.all([
        db.select({ value: count() }).from(users),
        db.select({ total: count(), active: sql<number>`sum(case when ${urls.expires} > unixepoch() then 1 else 0 end)` }).from(urls),
        db.select({ total: count(), open: sql<number>`sum(case when ${reports.status} in ('open', 'reviewing') then 1 else 0 end)` }).from(reports),
    ])
    const totalUrls = Number(urlCounts[0]?.total ?? 0)
    const activeUrls = Number(urlCounts[0]?.active ?? 0)
    return { stats: {
        users: Number(userCount[0]?.value ?? 0), urls: totalUrls, activeUrls,
        expiredUrls: totalUrls - activeUrls, reports: Number(reportCounts[0]?.total ?? 0),
        openReports: Number(reportCounts[0]?.open ?? 0),
    } }
})
