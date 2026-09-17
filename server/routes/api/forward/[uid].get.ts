import { urls } from '~/server/db/schema';
import { and, eq, gte } from 'drizzle-orm';
import { useDrizzle } from '~/server/utils/useDrizzle';
import { getShortLinkDomain } from '~/server/utils/shortLinkDomain';

export interface IUIDGetResponse {
  id: number;
  tld: string;
  uid: string;
  forward: string;
  created_at: Date;
  updated_at: Date;
  expires: Date;
}

export default defineEventHandler(async (event) => {
  const db = useDrizzle(event.context.cloudflare.env.DB);
  const query = getQuery(event);
  const tld = getShortLinkDomain(event, typeof query.tld === 'string' ? query.tld : undefined);

  const uid = getRouterParam(event, 'uid') ?? '';
  if (!uid)
    throw createError({
      status: 404,
      message: 'Not found',
    });

  const result = await db.query.urls.findFirst({
    where: and(eq(urls.tld, tld), eq(urls.uid, uid), gte(urls.expires, new Date())),
  });

  if (result) {
    const data: IUIDGetResponse = {
      id: result.id,
      tld: result.tld,
      uid: result.uid,
      forward: result.forward,
      created_at: result.created_at,
      updated_at: result.updated_at,
      expires: result.expires,
    };

    return data;
  }
  throw createError({
    status: 404,
    message: 'Not found',
  });
});
