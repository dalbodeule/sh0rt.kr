import { and, eq, gte } from 'drizzle-orm';
import { UAParser } from 'ua-parser-js';
import parser from 'accept-language-parser';
import { urls } from '~/server/db/schema';
import { useDrizzle } from '~/server/utils/useDrizzle';
import sha256 from '~/server/utils/sha256';
import { reservedPaths } from '~/common/reservedPaths';
import { getShortLinkDomain } from '~/server/utils/shortLinkDomain';

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'GET' && getMethod(event) !== 'HEAD') return;

  const path = getRequestURL(event).pathname;
  const uid = path.match(/^\/([a-zA-Z0-9]{3,20})\/?$/)?.[1];
  if (!uid || reservedPaths.has(uid.toLowerCase())) return;

  const env = event.context.cloudflare?.env as unknown as Env | undefined;
  if (!env?.DB) return;

  const db = useDrizzle(env.DB);
  let tld: string;
  try {
    tld = getShortLinkDomain(event);
  } catch {
    return;
  }
  const result = await db.query.urls.findFirst({
    columns: { forward: true },
    where: and(eq(urls.tld, tld), eq(urls.uid, uid), gte(urls.expires, new Date())),
  });
  if (!result) return;

  const target = new URL(result.forward);
  if (!['http:', 'https:'].includes(target.protocol)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid redirect target' });
  }

  if (getMethod(event) === 'GET' && env.ANALYTICS) {
    try {
      const ua = new UAParser(getHeader(event, 'user-agent') ?? '');
      const language =
        parser.parse(getHeader(event, 'accept-language') ?? '')[0]?.code ?? 'unknown';
      const cf = event.context.cf as Partial<IncomingRequestCfProperties> | undefined;
      const rawIp =
        getHeader(event, 'cf-connecting-ip') ?? getRequestIP(event, { xForwardedFor: true }) ?? '';
      const ipHash = rawIp ? await sha256(`${rawIp}\0${env.NUXT_SESSION_PASSWORD}`) : 'unknown';
      const browser = ua.getBrowser();
      const os = ua.getOS();
      const requestUrl = getRequestURL(event);
      let sourceDomain = 'direct';
      let sourcePath = 'direct';
      const referer = getHeader(event, 'referer');
      if (referer) {
        try {
          const source = new URL(referer);
          sourceDomain = source.hostname.toLowerCase();
          sourcePath = source.pathname || '/';
        } catch {
          sourceDomain = 'invalid';
          sourcePath = 'invalid';
        }
      }

      env.ANALYTICS.writeDataPoint({
        indexes: [tld, uid],
        blobs: [
          ipHash,
          cf?.country ?? 'unknown',
          cf?.region ?? 'unknown',
          cf?.city ?? 'unknown',
          cf?.colo ?? 'unknown',
          String(cf?.latitude ?? 'unknown'),
          String(cf?.longitude ?? 'unknown'),
          browser.name ?? 'unknown',
          ua.getDevice().model ?? ua.getDevice().type ?? 'desktop',
          language,
          [os.name, os.version].filter(Boolean).join(' ') || 'unknown',
          browser.version ?? 'unknown',
          sourceDomain,
          sourcePath,
          requestUrl.hostname.toLowerCase(),
          requestUrl.pathname,
        ],
      });
    } catch (error) {
      console.warn('Could not record redirect analytics', error);
    }
  }

  setHeader(event, 'Cache-Control', 'no-store');
  return sendRedirect(event, target.toString(), 302);
});
