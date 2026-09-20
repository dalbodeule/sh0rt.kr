import PostalMime from 'postal-mime';
import { and, eq } from 'drizzle-orm';
import { reports, urls } from '~/server/db/schema';
import { useDrizzle } from '~/server/utils/useDrizzle';
import { analyzeReportWithAi } from '~/server/utils/reportAi';

const MAX_REPORT_EMAIL_SIZE = 2 * 1024 * 1024;

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('cloudflare:email', async (payload) => {
    const config = useRuntimeConfig();
    const domains = String(config.reportDomains ?? '');
    const emails = String(config.reportEmails ?? '');

    const reportDomains: string[] = domains
      .split(',')
      .map((domain) => domain.trim().toLowerCase().replace(/^@/, ''))
      .filter(Boolean);
    const reportEmails = [
      ...new Set([
        ...emails
          .split(',')
          .map((email) => email.trim().toLowerCase())
          .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
        ...reportDomains.map((domain) => `report@${domain}`),
      ]),
    ];

    if (!reportEmails.length) return;
    if (!payload.message.to || !payload.message.from || !payload.message.raw) return;
    if (!reportEmails.includes(payload.message.to.trim().toLowerCase())) return;
    if (payload.message.rawSize > MAX_REPORT_EMAIL_SIZE) {
      payload.message.setReject('Report email is too large');
      return;
    }

    const parsed = await PostalMime.parse(payload.message.raw);
    const text = (parsed.text || '').slice(0, 20000);
    const escapedDomains = reportDomains.map((domain) =>
      domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const match = escapedDomains.length
      ? text.match(
          new RegExp(`https?:\\/\\/(?:${escapedDomains.join('|')})\\/([a-zA-Z0-9]{3,20})`, 'i')
        )
      : null;
    const uid = match?.[1] ?? null;
    const tld = match ? new URL(match[0]).hostname.toLowerCase() : (reportDomains[0] ?? null);

    const db = useDrizzle((payload.env as { DB: D1Database }).DB);

    const target = uid
      ? await db
          .select({ id: urls.id, tld: urls.tld, uid: urls.uid, forward: urls.forward })
          .from(urls)
          .where(and(eq(urls.tld, tld ?? ''), eq(urls.uid, uid)))
          .limit(1)
      : [];

    const created = await db
      .insert(reports)
      .values({
        url_id: target[0]?.id ?? null,
        tld: target[0]?.tld ?? tld,
        uid: target[0]?.uid ?? uid,
        forward: target[0]?.forward ?? null,
        reason: 'email',
        details: '',
        source: 'email',
        sender: payload.message.from.slice(0, 255),
        subject: (parsed.subject || '').slice(0, 500),
        body_text: text,
        status: 'open',
      })
      .returning({ id: reports.id });
    const report = created[0];
    if (report) {
      await analyzeReportWithAi(
        report.id,
        payload.env as {
          DB: D1Database;
          AI?: { run: (model: string, input: unknown) => Promise<unknown> };
        }
      );
    }
  });
});
