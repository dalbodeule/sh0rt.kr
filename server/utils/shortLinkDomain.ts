import type { H3Event } from 'h3';
import { getRequestURL } from 'h3';

const normalizeDomain = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '')
    .replace(/^www\./, '');

export const getConfiguredShortLinkDomains = (event: H3Event): string[] => {
  const configured = String(useRuntimeConfig(event).reportDomains ?? '')
    .split(',')
    .map(normalizeDomain)
    .filter(Boolean);
  return configured.length
    ? [...new Set(configured)]
    : [normalizeDomain(getRequestURL(event).hostname)];
};

export const getShortLinkDomain = (event: H3Event, requestedDomain?: string): string => {
  const domain = normalizeDomain(requestedDomain || getRequestURL(event).hostname);
  if (!getConfiguredShortLinkDomains(event).includes(domain)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported short URL domain' });
  }
  return domain;
};
