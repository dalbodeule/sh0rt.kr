import { and, eq } from 'drizzle-orm';
import type { H3Event } from 'h3';
import { users } from '~/server/db/schema';
import { useDrizzle } from '~/server/utils/useDrizzle';

export default async function (
  event: H3Event,
  provider: string,
  user: {
    accountId: string;
    email: string;
    name: string;
    avatar_url: string;
  }
): Promise<boolean> {
  if (!['google', 'github', 'twitch', 'chzzk'].includes(provider) || !user.accountId.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid OAuth profile' });
  }

  const accountId = user.accountId.trim().slice(0, 255);
  const email = user.email.trim().toLowerCase().slice(0, 255);
  const name = user.name.trim().slice(0, 20);
  let profile = '/favicon.png';
  try {
    const avatar = new URL(user.avatar_url);
    if (avatar.protocol === 'https:') profile = avatar.toString().slice(0, 4096);
  } catch {
    // Keep the local fallback image for malformed provider data.
  }
  if (!email || !name)
    throw createError({ statusCode: 400, statusMessage: 'Incomplete OAuth profile' });

  const db = useDrizzle(event.context.cloudflare.env.DB);

  let db_user = await db.query.users.findFirst({
    where: and(eq(users.token, accountId), eq(users.vendor, provider)),
  });

  if (db_user) {
    await db
      .update(users)
      .set({
        updated_at: new Date(),
        email,
        name,
        profile,
      })
      .where(and(eq(users.token, accountId), eq(users.vendor, provider)));
  } else {
    await db
      .insert(users)
      .values({
        email,
        name,
        vendor: provider,
        token: accountId,
        profile,
      })
      .onConflictDoNothing({ target: [users.vendor, users.token] });
  }

  db_user = await db.query.users.findFirst({
    where: and(eq(users.token, accountId), eq(users.vendor, provider)),
  });

  if (!db_user || (db_user.login_limit?.getTime() ?? 0) > Date.now()) {
    await clearUserSession(event);
    return false;
  }

  await setUserSession(event, {
    user: {
      id: db_user!.id,
      email: db_user!.email,
      name: db_user!.name,
      vendor: db_user!.vendor,
      profile: db_user!.profile,
      created_at: db_user!.created_at,
      updated_at: db_user!.updated_at,
      role: db_user!.role,
    },
    secure: {
      refreshedAt: Date.now(),
    },
  });
  return true;
}
