import { eq } from 'drizzle-orm';
import { urls, UserRole } from '~/server/db/schema';
import { useDrizzle } from '~/server/utils/useDrizzle';
import { requireRole } from '~/server/utils/requireRole';

export default defineEventHandler(async (event) => {
  await requireRole(event, UserRole.MODERATOR);
  const id = Number(getRouterParam(event, 'id'));
  if (!Number.isSafeInteger(id) || id <= 0)
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL id' });

  const db = useDrizzle(event.context.cloudflare.env.DB);
  const target = await db.query.urls.findFirst({
    where: eq(urls.id, id),
    columns: { id: true },
  });
  if (!target) throw createError({ statusCode: 404, statusMessage: 'URL not found' });

  const now = new Date();
  await db.update(urls).set({ expires: now, updated_at: now }).where(eq(urls.id, target.id));
  return { success: true, expires: now };
});
