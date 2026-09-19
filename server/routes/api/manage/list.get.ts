import { and, count, desc, eq, like, lte, or, sql, type SQL } from 'drizzle-orm';
import { urls, usersToUrls } from '~/server/db/schema';
import { getPagination } from '~/server/utils/pagination';
import { requireActiveUser } from '~/server/utils/requireRole';
import { useDrizzle } from '~/server/utils/useDrizzle';

export default defineEventHandler(async (event) => {
  const user = await requireActiveUser(event);
  const query = getQuery(event);
  const { page, pageSize, offset } = getPagination(query);
  const filters: SQL[] = [eq(usersToUrls.user, user.id)];
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 200) : '';
  if (q) {
    const term = `%${q.toLowerCase()}%`;
    filters.push(or(like(sql`lower(${urls.uid})`, term), like(sql`lower(${urls.forward})`, term))!);
  }
  if (query.status === 'expired') filters.push(lte(urls.expires, new Date()));
  if (query.status === 'active') filters.push(sql`${urls.expires} > unixepoch()`);
  const where = and(...filters);
  const db = useDrizzle(event.context.cloudflare.env.DB);
  const ownerWhere = eq(usersToUrls.user, user.id);
  const [items, totals, stats] = await Promise.all([
    db
      .select({
        id: urls.id,
        tld: urls.tld,
        uid: urls.uid,
        manage_id: urls.manage_id,
        forward: urls.forward,
        created_at: urls.created_at,
        updated_at: urls.updated_at,
        expires: urls.expires,
      })
      .from(urls)
      .innerJoin(usersToUrls, eq(urls.id, usersToUrls.url))
      .where(where)
      .orderBy(desc(urls.created_at))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ value: count() })
      .from(urls)
      .innerJoin(usersToUrls, eq(urls.id, usersToUrls.url))
      .where(where),
    db
      .select({
        total: count(),
        active: sql<number>`sum(case when ${urls.expires} > unixepoch() then 1 else 0 end)`,
      })
      .from(urls)
      .innerJoin(usersToUrls, eq(urls.id, usersToUrls.url))
      .where(ownerWhere),
  ]);
  const totalOwned = Number(stats[0]?.total ?? 0);
  const active = Number(stats[0]?.active ?? 0);
  return {
    items,
    page,
    pageSize,
    total: Number(totals[0]?.value ?? 0),
    stats: { total: totalOwned, active, expired: totalOwned - active },
  };
});
