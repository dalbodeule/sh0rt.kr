import { eq } from 'drizzle-orm';
import { users } from '~/server/db/schema';
import { useDrizzle } from '~/server/utils/useDrizzle';

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user?.id) return { loggedIn: false };
  const db = useDrizzle(event.context.cloudflare.env.DB);
  const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
  if (!user || (user.login_limit?.getTime() ?? 0) > Date.now()) {
    await clearUserSession(event);
    throw createError({ statusCode: 403, statusMessage: 'ACCOUNT_RESTRICTED' });
  }
  return { loggedIn: true };
});
