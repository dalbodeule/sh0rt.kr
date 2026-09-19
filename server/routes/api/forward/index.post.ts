import type { IUIDGetResponse } from '~/server/routes/api/forward/[uid].get';
import type { H3Event } from 'h3';
import { urlBlacklist, urls, usersToUrls } from '~/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import dayjs from 'dayjs';
import { useDrizzle } from '~/server/utils/useDrizzle';
import { reservedPaths } from '~/common/reservedPaths';
import { requireActiveUser } from '~/server/utils/requireRole';
import { getShortLinkDomain } from '~/server/utils/shortLinkDomain';

export interface IUIDPostRequest {
  tld?: string;
  uid: string | undefined;
  forward: string | undefined;
  expires: string | undefined;
  token: string | undefined;
}

export interface IUIDPostResponse extends IUIDGetResponse {
  manage_id: string;
}

export default defineEventHandler(async (event: H3Event) => {
  const user = await requireActiveUser(event);

  const request = (await readBody(event)) as IUIDPostRequest;
  if (
    !request.uid ||
    !/^[a-zA-Z0-9]{3,20}$/.test(request.uid) ||
    reservedPaths.has(request.uid.toLowerCase()) ||
    !request.forward ||
    !request.expires ||
    !request.token
  )
    throw createError({
      status: 403,
      message: 'Body is wrong',
    });

  const verify = await verifyTurnstileToken(request.token, event);
  if (!verify.success)
    throw createError({
      status: 403,
      message: 'Captcha is wrong',
    });

  const db = useDrizzle(event.context.cloudflare.env.DB);
  const tld = getShortLinkDomain(event, request.tld);

  const result = await db.query.urls.findFirst({
    where: and(eq(urls.tld, tld), eq(urls.uid, request.uid)),
  });

  if (result)
    throw createError({
      status: 403,
      statusMessage: 'Invalid uid',
    });

  const blocked = await db.query.urlBlacklist.findFirst({
    where: sql`lower(${urlBlacklist.uid}) = lower(${request.uid})`,
  });
  if (blocked) {
    throw createError({ statusCode: 403, statusMessage: 'This UID is unavailable' });
  }

  const expires = dayjs(request.expires).endOf('day');
  const maximumExpires = dayjs().add(3, 'year').endOf('day');
  if (!expires.isValid() || !expires.isAfter(dayjs()) || expires.isAfter(maximumExpires)) {
    throw createError({ status: 400, message: 'Invalid expiration date' });
  }

  let parsedForward: URL;
  try {
    parsedForward = new URL(request.forward);
    if (
      !['http:', 'https:'].includes(parsedForward.protocol) ||
      parsedForward.username ||
      parsedForward.password ||
      parsedForward.toString().length > 4096
    )
      throw new Error('unsupported URL');
  } catch {
    throw createError({ status: 400, message: 'Invalid forward URL' });
  }

  const manageId = crypto.randomUUID();
  try {
    await db.batch([
      db.insert(urls).values({
        tld,
        uid: request.uid,
        manage_id: manageId,
        forward: parsedForward.toString(),
        expires: expires.toDate(),
      }),
      db.insert(usersToUrls).values({
        user: user.id,
        url: sql<number>`(select ${urls.id} from ${urls} where ${urls.manage_id} = ${manageId})`,
      }),
    ]);
  } catch (error) {
    if (error instanceof Error && /unique/i.test(error.message)) {
      throw createError({ statusCode: 409, statusMessage: 'UID already exists' });
    }
    throw error;
  }

  const created = await db.query.urls.findFirst({ where: eq(urls.manage_id, manageId) });
  if (!created) throw createError({ statusCode: 500, statusMessage: 'Could not create URL' });

  const responseData: IUIDPostResponse = {
    id: created.id,
    tld: created.tld,
    uid: created.uid,
    manage_id: created.manage_id,
    forward: created.forward,
    created_at: created.created_at,
    updated_at: created.updated_at,
    expires: created.expires,
  };

  return responseData;
});
