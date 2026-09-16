import { eq } from 'drizzle-orm'
import type { PublicStats } from '~/server/utils/globalStats'
import { globalStats } from '~/server/db/schema'
import { refreshGlobalStats } from '~/server/utils/globalStats'
import { useDrizzle } from '~/server/utils/useDrizzle'

export default defineEventHandler(async (event) => {
    const binding = event.context.cloudflare.env.DB
    const db = useDrizzle(binding)
    const cached = await db.select().from(globalStats).where(eq(globalStats.id, 1)).limit(1)
    const row = cached[0]
    if (!row || Date.now() - row.updated_at.getTime() > 60 * 60 * 1000) return refreshGlobalStats(binding)
    try {
        return JSON.parse(row.data) as PublicStats
    } catch {
        return refreshGlobalStats(binding)
    }
})
