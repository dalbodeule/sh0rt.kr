import { and, eq } from 'drizzle-orm';
import { reports, urls } from '~/server/db/schema';
import { useDrizzle } from '~/server/utils/useDrizzle';
import { getConfiguredShortLinkDomains, getShortLinkDomain } from '~/server/utils/shortLinkDomain';
import { scheduleReportAiReview } from '~/server/utils/reportAi';

interface ReportBody {
  uid?: string;
  email?: string;
  reason?: string;
  details?: string;
  token?: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ReportBody>(event);
  const rawUid = body.uid?.trim() ?? '';
  let tld = getShortLinkDomain(event);
  let uid = rawUid;
  if (/^https?:\/\//i.test(rawUid)) {
    try {
      const parsed = new URL(rawUid);
      tld = parsed.hostname.toLowerCase();
      if (!getConfiguredShortLinkDomains(event).includes(tld))
        throw new Error('unsupported domain');
      uid = parsed.pathname.replace(/^\//, '').replace(/\/$/, '');
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Invalid report URL' });
    }
  }
  const email = body.email?.trim() || null;
  const reason = body.reason?.trim();
  const details = body.details?.trim() || '';
  if (
    !uid ||
    !/^[a-zA-Z0-9]{3,20}$/.test(uid) ||
    !reason ||
    !['spam', 'phishing', 'malware', 'illegal', 'other'].includes(reason) ||
    details.length > 5000 ||
    !body.token
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid report' });
  }
  if (email && (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email' });
  }
  const verification = await verifyTurnstileToken(body.token, event);
  if (!verification.success)
    throw createError({ statusCode: 403, statusMessage: 'Captcha verification failed' });
  const db = useDrizzle(event.context.cloudflare.env.DB);
  const target = await db
    .select({ id: urls.id, tld: urls.tld, uid: urls.uid, forward: urls.forward })
    .from(urls)
    .where(and(eq(urls.tld, tld), eq(urls.uid, uid)))
    .limit(1);
  if (!target[0]) throw createError({ statusCode: 404, statusMessage: 'Short URL not found' });
  const created = await db
    .insert(reports)
    .values({
      url_id: target[0].id,
      tld: target[0].tld,
      uid: target[0].uid,
      forward: target[0].forward,
      reporter_email: email,
      reason,
      details,
      source: 'web',
      status: 'open',
    })
    .returning({ id: reports.id });
  const report = created[0];
  if (!report) throw createError({ statusCode: 500, statusMessage: 'Report was not created' });
  scheduleReportAiReview(event, report.id);
  return { success: true, reportId: report.id };
});
