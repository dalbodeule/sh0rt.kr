import { and, eq } from 'drizzle-orm';
import { UserRole, reports, urls, users, usersToUrls } from '~/server/db/schema';
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

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid report id' });
  }
  if (!body || !['resolved', 'dismissed'].includes(body.status ?? '')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid report action' });
  }
  if (body.suspendUser && !['7d', '30d', 'permanent'].includes(body.suspension ?? '')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid suspension period' });
  }

  const rawBinding = event.context.cloudflare.env.DB;
  const db = useDrizzle(rawBinding);
  const binding = rawBinding as D1Database;
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

  let owner: { id: number; role: UserRole } | undefined;
  if (targetUrl) {
    owner = await db
      .select({ id: users.id, role: users.role })
      .from(usersToUrls)
      .innerJoin(users, eq(usersToUrls.user, users.id))
      .where(eq(usersToUrls.url, targetUrl.id))
      .limit(1)
      .then((rows) => rows[0]);
  }

  if (body.suspendUser && !owner) {
    throw createError({ statusCode: 404, statusMessage: 'URL owner not found' });
  }
  if (
    body.suspendUser &&
    owner &&
    admin.role < UserRole.ADMIN &&
    owner.role >= UserRole.MODERATOR
  ) {
    throw createError({ statusCode: 403, statusMessage: 'Elevated accounts require an admin' });
  }

  const now = new Date();
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const statements: D1PreparedStatement[] = [];
  if (body.expireUrl && targetUrl) {
    statements.push(
      binding
        .prepare('UPDATE urls SET expires = ?, updated_at = ? WHERE id = ?')
        .bind(nowSeconds, nowSeconds, targetUrl.id)
    );
  }

  if (body.blacklist && targetUrl) {
    statements.push(
      binding
        .prepare(
          'INSERT INTO urlBlacklist (uid, reason, created_by, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(uid) DO NOTHING'
        )
        .bind(targetUrl.uid, `Report #${report.id}: ${report.reason}`, admin.id, nowSeconds)
    );
  }

  if (body.suspendUser && owner) {
    const loginLimit =
      body.suspension === 'permanent'
        ? new Date('9999-12-31T23:59:59.000Z')
        : new Date(Date.now() + (body.suspension === '30d' ? 30 : 7) * 86400000);
    statements.push(
      binding
        .prepare('UPDATE users SET login_limit = ?, updated_at = ? WHERE id = ?')
        .bind(Math.floor(loginLimit.getTime() / 1000), nowSeconds, owner.id)
    );
  }

  statements.push(
    binding
      .prepare('UPDATE reports SET status = ?, updated_at = ? WHERE id = ?')
      .bind(body.status, nowSeconds, report.id)
  );
  await binding.batch(statements);

  return {
    success: true,
    reportId: report.id,
    urlId: targetUrl?.id ?? null,
    ownerId: owner?.id ?? null,
  };
});
