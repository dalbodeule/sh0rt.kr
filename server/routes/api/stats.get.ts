import { eq } from 'drizzle-orm';
import type { PublicStats } from '~/server/utils/globalStats';
import { globalStats } from '~/server/db/schema';
import { refreshGlobalStats } from '~/server/utils/globalStats';
import { useDrizzle } from '~/server/utils/useDrizzle';

export default defineEventHandler(async (event) => {
  const binding = event.context.cloudflare.env.DB;
  const db = useDrizzle(binding);
  const cached = await db.select().from(globalStats).where(eq(globalStats.id, 1)).limit(1);
  const row = cached[0];
  if (row) {
    try {
      const stats = JSON.parse(row.data) as PublicStats;
      if (Date.now() - row.updated_at.getTime() <= 60 * 60 * 1000) return stats;

      const waitUntil = (event.context as { waitUntil?: (task: Promise<unknown>) => void })
        .waitUntil;
      const refresh = refreshGlobalStats(binding).catch((error) => {
        console.warn('Could not refresh public stats', error);
      });
      if (waitUntil) {
        waitUntil(refresh);
        return stats;
      }
      return refreshGlobalStats(binding);
    } catch {
      return refreshGlobalStats(binding);
    }
  }

  return refreshGlobalStats(binding);
});
