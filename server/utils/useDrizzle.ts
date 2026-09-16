import { drizzle } from 'drizzle-orm/d1';

import * as schema from '../db/schema';
export { sql, eq, and, or } from 'drizzle-orm';

export const tables = schema;

export function useDrizzle(binding: unknown) {
  if (!binding || typeof binding !== 'object' || !('prepare' in binding)) {
    throw createError({ statusCode: 503, statusMessage: 'Database binding is unavailable' });
  }

  return drizzle(binding as D1Database, { schema });
}

export type User = typeof schema.users.$inferSelect;
