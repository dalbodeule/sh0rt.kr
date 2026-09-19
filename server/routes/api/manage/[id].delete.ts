import type { H3Event } from 'h3';
import { and, eq, gte } from 'drizzle-orm';
import { urls } from '~/server/db/schema';
import { useDrizzle } from '~/server/utils/useDrizzle';
import { requireActiveUser } from '~/server/utils/requireRole';

export default defineEventHandler(async (event: H3Event) => {
  const user = await requireActiveUser(event);
  const manageId = getRouterParam(event, 'id') ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(manageId)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' });
  }

  const db = useDrizzle(event.context.cloudflare.env.DB);
  const target = await db.query.urls.findFirst({
    where: and(eq(urls.manage_id, manageId), gte(urls.expires, new Date())),
    with: { UsersToUrls: true },
  });
  if (!target || !target.UsersToUrls.some((owner) => owner.user === user.id)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' });
  }

  const now = new Date();
  await db.update(urls).set({ expires: now, updated_at: now }).where(eq(urls.id, target.id));
  return { success: true, expires: now };
});
