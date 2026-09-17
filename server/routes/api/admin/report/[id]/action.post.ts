import { and, eq } from 'drizzle-orm';
import { UserRole, reports, urlBlacklist, urls, users, usersToUrls } from '~/server/db/schema';
import { requireRole } from '~/server/utils/requireRole';
import { useDrizzle } from '~/server/utils/useDrizzle';

type Suspension = '7d' | '30d' | 'permanent';

interface ReportActionBody {
  status?: 'resolved' | 'dismissed';
  suspendUser?: boolean;
  suspension?: Suspension;
  expireUrl?: boolean;
  blacklist?: boolean;
}

export default defineEventHandler(async (event) => {
  const admin = await requireRole(event, UserRole.MODERATOR);
  const id = Number(getRouterParam(event, 'id'));
  const body = await readBody<ReportActionBody>(event);

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid report id' });
  }
  if (!body || !['resolved', 'dismissed'].includes(body.status ?? '')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid report action' });
  }
  if (body.suspendUser && !['7d', '30d', 'permanent'].includes(body.suspension ?? '')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid suspension period' });
  }

  const db = useDrizzle(event.context.cloudflare.env.DB);
  const report = await db.query.reports.findFirst({ where: eq(reports.id, id) });
  if (!report) throw createError({ statusCode: 404, statusMessage: 'Report not found' });

  let targetUrl: typeof urls.$inferSelect | undefined;
  if (report.url_id) {
    targetUrl = await db.query.urls.findFirst({ where: eq(urls.id, report.url_id) });
  }
  if (!targetUrl && report.uid) {
    targetUrl = await db.query.urls.findFirst({
      where: report.tld
        ? and(eq(urls.tld, report.tld), eq(urls.uid, report.uid))
        : eq(urls.uid, report.uid),
    });
  }

  if ((body.expireUrl || body.blacklist) && !targetUrl) {
    throw createError({ statusCode: 404, statusMessage: 'Reported URL not found' });
  }

  let owner: { id: number } | undefined;
  if (targetUrl) {
    owner = await db
      .select({ id: users.id })
      .from(usersToUrls)
      .innerJoin(users, eq(usersToUrls.user, users.id))
      .where(eq(usersToUrls.url, targetUrl.id))
      .limit(1)
      .then((rows) => rows[0]);
  }

  if (body.suspendUser && !owner) {
    throw createError({ statusCode: 404, statusMessage: 'URL owner not found' });
  }

  const now = new Date();
  if (body.expireUrl && targetUrl) {
    await db
      .update(urls)
      .set({ expires: new Date(0), updated_at: now })
      .where(eq(urls.id, targetUrl.id));
  }

  if (body.blacklist && targetUrl) {
    await db
      .insert(urlBlacklist)
      .values({
        uid: targetUrl.uid,
        reason: `Report #${report.id}: ${report.reason}`,
        created_by: admin.id,
      })
      .onConflictDoNothing({ target: urlBlacklist.uid });
  }

  if (body.suspendUser && owner) {
    const loginLimit =
      body.suspension === 'permanent'
        ? new Date('9999-12-31T23:59:59.000Z')
        : new Date(Date.now() + (body.suspension === '30d' ? 30 : 7) * 86400000);
    await db
      .update(users)
      .set({ login_limit: loginLimit, updated_at: now })
      .where(eq(users.id, owner.id));
  }

  await db
    .update(reports)
    .set({ status: body.status, updated_at: now })
    .where(eq(reports.id, report.id));

  return {
    success: true,
    reportId: report.id,
    urlId: targetUrl?.id ?? null,
    ownerId: owner?.id ?? null,
  };
});
