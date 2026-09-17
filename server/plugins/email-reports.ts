import PostalMime from 'postal-mime';
import { and, eq } from 'drizzle-orm';
import { reports, urls } from '~/server/db/schema';
import { useDrizzle } from '~/server/utils/useDrizzle';

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('cloudflare:email', async (payload) => {
    const config = useRuntimeConfig();
    const domains = String(config.reportDomains ?? '');

    const reportDomains: string[] = domains
      .split(',')
      .map((domain) => domain.trim().toLowerCase().replace(/^@/, ''))
      .filter(Boolean);
    const reportEmails: string[] = [
      ...new Set([...reportDomains.map((domain) => `report@${domain}`)]),
    ];

    if (!reportEmails.length && !reportDomains.length) return;
    if (!payload.message.to || !payload.message.from || !payload.message.raw) return;
    if (!reportEmails.includes(payload.message.to.trim().toLowerCase())) return;

    const parsed = await PostalMime.parse(payload.message.raw);
    const text = (parsed.text || '').slice(0, 20000);
    const escapedDomains = reportDomains
      .map((domain) => domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    const match = text.match(
      new RegExp(`https?:\\/\\/(?:${escapedDomains})\\/([a-zA-Z0-9]{3,20})`, 'i')
    );
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

    await db.insert(reports).values({
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
    });
  });
});
