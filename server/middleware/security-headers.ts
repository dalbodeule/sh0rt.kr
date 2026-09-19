import type { H3Event } from 'h3';

export default defineEventHandler((event: H3Event) => {
  setHeader(event, 'X-Content-Type-Options', 'nosniff');
  setHeader(event, 'X-Frame-Options', 'DENY');
  setHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin');
  setHeader(
    event,
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );
});
