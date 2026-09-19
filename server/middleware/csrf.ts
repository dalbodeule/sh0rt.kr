import { getCookie, getHeader, getRequestURL, setCookie, type H3Event } from 'h3';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_COOKIE = 'csrf-token';

function getOriginFromReferer(referer: string | undefined) {
  if (!referer) return undefined;

  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}

function normalizeOrigin(origin: string | undefined) {
  if (!origin) return undefined;

  try {
    return new URL(origin).origin;
  } catch {
    return undefined;
  }
}

function isSameOriginRequest(event: H3Event) {
  const requestOrigin = getRequestURL(event).origin;
  const configuredOrigin = normalizeOrigin(useRuntimeConfig(event).public.baseUrl);
  const allowedOrigins = new Set([requestOrigin, configuredOrigin].filter(Boolean));

  const origin = normalizeOrigin(getHeader(event, 'origin'));
  if (origin) return allowedOrigins.has(origin);

  const refererOrigin = getOriginFromReferer(getHeader(event, 'referer'));
  return Boolean(refererOrigin && allowedOrigins.has(refererOrigin));
}

function ensureCsrfToken(event: H3Event) {
  const currentToken = getCookie(event, CSRF_COOKIE);
  if (currentToken) return currentToken;

  const token = crypto.randomUUID();
  setCookie(event, CSRF_COOKIE, token, {
    httpOnly: false,
    path: '/',
    sameSite: 'strict',
    secure: getRequestURL(event).protocol === 'https:',
  });
  event.context.csrfToken = token;
  return token;
}

export default defineEventHandler((event: H3Event) => {
  if (!event.path.startsWith('/api/')) return;

  const csrfToken = ensureCsrfToken(event);

  if (!STATE_CHANGING_METHODS.has(event.method)) return;

  if (!isSameOriginRequest(event)) {
    throw createError({ statusCode: 403, statusMessage: 'Cross-site request rejected' });
  }

  if (getHeader(event, 'x-csrf-token') !== csrfToken) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid CSRF token' });
  }
});
