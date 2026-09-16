import { eq, sql } from 'drizzle-orm';
import { globalStats, reports, urls, users } from '~/server/db/schema';
import { useDrizzle } from '~/server/utils/useDrizzle';

export interface PublicStats {
  users: number;
  urls: number;
  activeUrls: number;
  expiredUrls: number;
  openReports: number;
  updatedAt: string;
}

export async function refreshGlobalStats(binding: unknown): Promise<PublicStats> {
  const db = useDrizzle(binding);
  const now = new Date();
  const [userCount, urlCounts, reportCount] = await Promise.all([
    db.select({ value: sql<number>`count(*)` }).from(users),
    db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when ${urls.expires} > unixepoch() then 1 else 0 end)`,
      })
      .from(urls),
    db
      .select({ value: sql<number>`count(*)` })
      .from(reports)
      .where(eq(reports.status, 'open')),
  ]);
  const total = Number(urlCounts[0]?.total ?? 0);
  const active = Number(urlCounts[0]?.active ?? 0);
  const stats: PublicStats = {
    users: Number(userCount[0]?.value ?? 0),
    urls: total,
    activeUrls: active,
    expiredUrls: total - active,
    openReports: Number(reportCount[0]?.value ?? 0),
    updatedAt: now.toISOString(),
  };
  await db
    .insert(globalStats)
    .values({ id: 1, data: JSON.stringify(stats), updated_at: now })
    .onConflictDoUpdate({
      target: globalStats.id,
      set: { data: JSON.stringify(stats), updated_at: now },
    });
  return stats;
}
