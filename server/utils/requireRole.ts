import type { H3Event } from 'h3';
import { UserRole, users } from '~/server/db/schema';
import { eq } from 'drizzle-orm';
import { useDrizzle } from '~/server/utils/useDrizzle';

export async function requireActiveUser(event: H3Event) {
  const session = await requireUserSession(event);
  const db = useDrizzle(event.context.cloudflare.env.DB);
  const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
  if (!user || (user.login_limit?.getTime() ?? 0) > Date.now()) {
    await clearUserSession(event);
    throw createError({ statusCode: 403, statusMessage: 'Account unavailable' });
  }
  return user;
}

export async function requireRole(event: H3Event, minimum: UserRole = UserRole.ADMIN) {
  const user = await requireActiveUser(event);
  if (user.role < minimum) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }
  return user;
}
