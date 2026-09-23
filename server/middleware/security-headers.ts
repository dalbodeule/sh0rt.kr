import type { H3Event } from 'h3';

export default defineEventHandler((event: H3Event) => {
  setHeader(event, 'X-Content-Type-Options', 'nosniff');
  setHeader(event, 'X-Frame-Options', 'DENY');
  setHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin');
  setHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  setHeader(event, 'Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  setHeader(event, 'X-Permitted-Cross-Domain-Policies', 'none');
  setHeader(
    event,
    'Content-Security-Policy',
    "base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
  );
  setHeader(
    event,
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );
});
