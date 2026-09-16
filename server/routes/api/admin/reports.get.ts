import { and, count, desc, eq, like, or, sql, type SQL } from 'drizzle-orm';
import { UserRole, reports } from '~/server/db/schema';
import { getPagination } from '~/server/utils/pagination';
import { requireRole } from '~/server/utils/requireRole';
import { useDrizzle } from '~/server/utils/useDrizzle';

export default defineEventHandler(async (event) => {
  await requireRole(event, UserRole.MODERATOR);
  const query = getQuery(event);
  const { page, pageSize, offset } = getPagination(query);
  const filters: SQL[] = [];
  if (
    typeof query.status === 'string' &&
    ['open', 'reviewing', 'resolved', 'dismissed'].includes(query.status)
  )
    filters.push(eq(reports.status, query.status));
  if (typeof query.source === 'string' && ['web', 'email'].includes(query.source))
    filters.push(eq(reports.source, query.source));
  const q = typeof query.q === 'string' ? query.q.trim() : '';
  if (q) {
    const term = `%${q.toLowerCase()}%`;
    filters.push(
      or(
        like(sql`lower(${reports.uid})`, term),
        like(sql`lower(${reports.sender})`, term),
        like(sql`lower(${reports.subject})`, term),
        like(sql`lower(${reports.details})`, term)
      )!
    );
  }
  const where = filters.length ? and(...filters) : undefined;
  const db = useDrizzle(event.context.cloudflare.env.DB);
  const [items, totals] = await Promise.all([
    db
      .select()
      .from(reports)
      .where(where)
      .orderBy(desc(reports.created_at))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(reports).where(where),
  ]);
  return { items, page, pageSize, total: Number(totals[0]?.value ?? 0) };
});
