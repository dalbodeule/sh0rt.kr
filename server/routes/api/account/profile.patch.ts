import { eq } from 'drizzle-orm';
import type { H3Event } from 'h3';
import { users } from '~/server/db/schema';
import { useDrizzle } from '~/server/utils/useDrizzle';
import { requireActiveUser } from '~/server/utils/requireRole';

interface ProfileRequest {
  name?: string;
}

export default defineEventHandler(async (event: H3Event) => {
  const user = await requireActiveUser(event);
  const body = await readBody<ProfileRequest>(event);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';

  if (!name || name.length > 20) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid name' });
  }

  const db = useDrizzle(event.context.cloudflare.env.DB);
  const updatedAt = new Date();
  await db.update(users).set({ name, updated_at: updatedAt }).where(eq(users.id, user.id));

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      name,
      vendor: user.vendor,
      profile: user.profile,
      created_at: user.created_at,
      updated_at: updatedAt,
      role: user.role,
    },
  });

  return { name, updated_at: updatedAt };
});
