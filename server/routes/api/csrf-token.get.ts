import { getCookie, type H3Event } from 'h3';

export default defineEventHandler((event: H3Event) => {
  const token = getCookie(event, 'csrf-token') ?? event.context.csrfToken;
  if (!token) throw createError({ statusCode: 500, statusMessage: 'CSRF token unavailable' });

  return { token };
});
