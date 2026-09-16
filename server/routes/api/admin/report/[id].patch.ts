import { eq } from 'drizzle-orm';
import { UserRole, reports } from '~/server/db/schema';
import { requireRole } from '~/server/utils/requireRole';
import { useDrizzle } from '~/server/utils/useDrizzle';

export default defineEventHandler(async (event) => {
  await requireRole(event, UserRole.MODERATOR);
  const id = Number(getRouterParam(event, 'id'));
  const body = await readBody<{ status?: string }>(event);
  if (!Number.isInteger(id) || id <= 0)
    throw createError({ statusCode: 400, statusMessage: 'Invalid report id' });
  if (!body.status || !['open', 'reviewing', 'resolved', 'dismissed'].includes(body.status))
    throw createError({ statusCode: 400, statusMessage: 'Invalid report status' });
  const db = useDrizzle(event.context.cloudflare.env.DB);
  const changed = await db
    .update(reports)
    .set({ status: body.status, updated_at: new Date() })
    .where(eq(reports.id, id))
    .returning({ id: reports.id });
  if (!changed.length) throw createError({ statusCode: 404, statusMessage: 'Report not found' });
  return { success: true };
});
