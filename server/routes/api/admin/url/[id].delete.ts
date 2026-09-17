import { and, eq } from 'drizzle-orm';
import { analyticsCache, urls, usersToUrls, UserRole } from '~/server/db/schema';
import { useDrizzle } from '~/server/utils/useDrizzle';
import { requireRole } from '~/server/utils/requireRole';

export default defineEventHandler(async (event) => {
  await requireRole(event, UserRole.MODERATOR);
  const id = Number(getRouterParam(event, 'id'));
  if (!Number.isInteger(id) || id <= 0)
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL id' });

  const db = useDrizzle(event.context.cloudflare.env.DB);
  const target = await db.query.urls.findFirst({
    where: eq(urls.id, id),
    columns: { id: true, tld: true, uid: true },
  });
  if (!target) throw createError({ statusCode: 404, statusMessage: 'URL not found' });

  await db.delete(usersToUrls).where(eq(usersToUrls.url, target.id));
  await db
    .delete(analyticsCache)
    .where(and(eq(analyticsCache.tld, target.tld), eq(analyticsCache.uid, target.uid)));
  await db.delete(urls).where(eq(urls.id, target.id));
  return { success: true };
});
