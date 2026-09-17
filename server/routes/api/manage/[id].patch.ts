import type { H3Event } from 'h3';
import { and, eq, gte } from 'drizzle-orm';
import dayjs from 'dayjs';
import { urls } from '~/server/db/schema';
import { useDrizzle } from '~/server/utils/useDrizzle';
import { requireActiveUser } from '~/server/utils/requireRole';
import type { IUIDGetResponse } from '~/server/routes/api/forward/[uid].get';
import type { IUIDPostRequest } from '~/server/routes/api/forward/index.post';

export default defineEventHandler(async (event: H3Event): Promise<IUIDGetResponse> => {
  const user = await requireActiveUser(event);
  const manageId = getRouterParam(event, 'id') ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(manageId)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' });
  }

  const request = await readBody<IUIDPostRequest>(event);
  if (!request.uid || !request.forward || !request.expires || !request.token) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' });
  }

  let parsedForward: URL;
  try {
    parsedForward = new URL(request.forward);
    if (
      !['http:', 'https:'].includes(parsedForward.protocol) ||
      parsedForward.toString().length > 4096
    )
      throw new Error('unsupported URL');
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid forward URL' });
  }

  const expires = dayjs(request.expires).endOf('day');
  const maximumExpires = dayjs().add(3, 'year').endOf('day');
  if (!expires.isValid() || !expires.isAfter(dayjs()) || expires.isAfter(maximumExpires)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid expiration date' });
  }

  const verify = await verifyTurnstileToken(request.token, event);
  if (!verify.success) throw createError({ statusCode: 403, statusMessage: 'Captcha is wrong' });

  const db = useDrizzle(event.context.cloudflare.env.DB);
  const result = await db.query.urls.findFirst({
    where: and(eq(urls.manage_id, manageId), gte(urls.expires, new Date())),
    with: { UsersToUrls: true },
  });
  if (!result || result.UsersToUrls[0]?.user !== user.id || request.uid !== result.uid) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' });
  }

  const updatedAt = new Date();
  await db
    .update(urls)
    .set({
      forward: parsedForward.toString(),
      expires: expires.toDate(),
      updated_at: updatedAt,
    })
    .where(eq(urls.id, result.id));

  return {
    id: result.id,
    tld: result.tld,
    uid: result.uid,
    forward: parsedForward.toString(),
    created_at: result.created_at,
    updated_at: updatedAt,
    expires: expires.toDate(),
  };
});
