import type { H3Event } from 'h3';
import { and, eq, gte, lte } from 'drizzle-orm';
import { AKeys, getFromAnalytics, getParams } from '~/server/utils/analyticHelper';
import { analyticsCache, urls } from '~/server/db/schema';
import { useDrizzle } from '~/server/utils/useDrizzle';
import { requireActiveUser } from '~/server/utils/requireRole';
import type { IUIDGetResponse } from '~/server/routes/api/forward/[uid].get';

const CACHE_TTL = 30 * 60 * 1000;
const MAX_ANALYTICS_AGE = 90 * 24 * 60 * 60 * 1000;

export interface IAnalytics {
  data: Record<string, string | null | undefined>[];
}

export interface IAnalyticsResponse {
  country: [string, string | number][];
  browser: [string, string | number][];
  language: [string, string | number][];
  device: [string, string | number][];
  os: [string, string | number][];
  sourceDomain: [string, string | number][];
  sourcePath: [string, string | number][];
  requestDomain: [string, string | number][];
  requestPath: [string, string | number][];
}

export interface IManageResponse {
  link: IUIDGetResponse;
  analytics: IAnalyticsResponse | null;
}

const aggregateDataByField = (
  response: IAnalytics,
  field: string,
  fieldName: string
): [string, string | number][] => {
  const counts = new Map<string, number>();
  for (const item of response.data) {
    const value = item[field]?.trim() || 'unknown';
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const rows = [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 20)
    .map(([key, value]): [string, number] => [key, value]);
  return [[fieldName, 'Visits'], ...rows];
};

export default defineEventHandler(async (event: H3Event): Promise<IManageResponse> => {
  const manageId = getRouterParam(event, 'id') ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(manageId)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' });
  }

  const activeUser = await requireActiveUser(event);
  const db = useDrizzle(event.context.cloudflare.env.DB);
  const currentShorten = await db.query.urls.findFirst({
    where: and(eq(urls.manage_id, manageId), gte(urls.expires, new Date())),
    with: { UsersToUrls: true },
  });

  if (!currentShorten || activeUser.id !== currentShorten.UsersToUrls[0]?.user) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' });
  }

  const link: IUIDGetResponse = {
    id: currentShorten.id,
    uid: currentShorten.uid,
    forward: currentShorten.forward,
    created_at: currentShorten.created_at,
    updated_at: currentShorten.updated_at,
    expires: currentShorten.expires,
  };

  await db
    .delete(analyticsCache)
    .where(lte(analyticsCache.created_at, new Date(Date.now() - CACHE_TTL)));
  const cachedData = await db.query.analyticsCache.findFirst({
    where: eq(analyticsCache.uid, currentShorten.uid),
  });
  if (cachedData) {
    try {
      const cached = JSON.parse(cachedData.data) as Partial<IAnalyticsResponse>;
      if (
        cached.sourceDomain &&
        cached.sourcePath &&
        cached.requestDomain &&
        cached.requestPath &&
        cached.os
      ) {
        return { link, analytics: cached as IAnalyticsResponse };
      }
    } catch {
      await db.delete(analyticsCache).where(eq(analyticsCache.id, cachedData.id));
    }
  }

  try {
    const analyticsUid = currentShorten.uid.replaceAll("'", "''");
    const startTime = Math.max(currentShorten.created_at.getTime(), Date.now() - MAX_ANALYTICS_AGE);
    const rawData = await getFromAnalytics(
      `SELECT ${getParams([
        AKeys.ip,
        AKeys.country,
        AKeys.region,
        AKeys.city,
        AKeys.colo,
        AKeys.latitude,
        AKeys.longitude,
        AKeys.browser,
        AKeys.device,
        AKeys.language,
        AKeys.os,
        AKeys.browserVersion,
        AKeys.sourceDomain,
        AKeys.sourcePath,
        AKeys.requestDomain,
        AKeys.requestPath,
      ])}, timestamp FROM ANALYTICS WHERE index1 = '${analyticsUid}' AND timestamp >= toDateTime(${Math.floor(startTime / 1000)}) LIMIT 10000`,
      event
    );
    const parsedData = JSON.parse(rawData) as IAnalytics;
    const analytics: IAnalyticsResponse = {
      country: aggregateDataByField(parsedData, 'country', 'Country'),
      browser: aggregateDataByField(parsedData, 'browser', 'Browser'),
      language: aggregateDataByField(parsedData, 'language', 'Language'),
      device: aggregateDataByField(parsedData, 'device', 'Device'),
      os: aggregateDataByField(parsedData, 'os', 'OS'),
      sourceDomain: aggregateDataByField(parsedData, 'sourceDomain', 'Domain'),
      sourcePath: aggregateDataByField(parsedData, 'sourcePath', 'URI'),
      requestDomain: aggregateDataByField(parsedData, 'requestDomain', 'Domain'),
      requestPath: aggregateDataByField(parsedData, 'requestPath', 'URI'),
    };

    await db
      .insert(analyticsCache)
      .values({
        uid: currentShorten.uid,
        data: JSON.stringify(analytics),
      })
      .onConflictDoUpdate({
        target: analyticsCache.uid,
        set: { data: JSON.stringify(analytics), created_at: new Date() },
      });
    return { link, analytics };
  } catch (error) {
    console.warn('Could not load analytics', error);
    return { link, analytics: null };
  }
});
