import { and, count, desc, eq, like, lte, or, sql, type SQL } from 'drizzle-orm';
import { UserRole, reports, urls, users, usersToUrls } from '~/server/db/schema';
import { getPagination } from '~/server/utils/pagination';
import { requireRole } from '~/server/utils/requireRole';
import { useDrizzle } from '~/server/utils/useDrizzle';

export default defineEventHandler(async (event) => {
  await requireRole(event, UserRole.MODERATOR);
  const query = getQuery(event);
  const { page, pageSize, offset } = getPagination(query);
  const filters: SQL[] = [];
  const q = typeof query.q === 'string' ? query.q.trim() : '';
  if (q) {
    const term = `%${q.toLowerCase()}%`;
    filters.push(or(like(sql`lower(${urls.uid})`, term), like(sql`lower(${urls.forward})`, term))!);
  }
  const requestedOwnerId = typeof query.userId === 'string' ? query.userId : query.ownerId;
  if (typeof requestedOwnerId === 'string' && Number.isInteger(Number(requestedOwnerId)))
    filters.push(eq(users.id, Number(requestedOwnerId)));
  const ownerQuery = typeof query.ownerQuery === 'string' ? query.ownerQuery.trim() : '';
  if (ownerQuery) {
    const term = `%${ownerQuery.toLowerCase()}%`;
    filters.push(
      or(like(sql`lower(${users.name})`, term), like(sql`lower(${users.email})`, term))!
    );
  }
  if (query.status === 'expired') filters.push(lte(urls.expires, new Date()));
  if (query.status === 'active') filters.push(sql`${urls.expires} > unixepoch()`);
  if (query.spam === 'reported')
    filters.push(
      sql`exists (select 1 from ${reports} where ${reports.url_id} = ${urls.id} and ${reports.status} in ('open', 'reviewing'))`
    );
  if (query.spam === 'clean')
    filters.push(
      sql`not exists (select 1 from ${reports} where ${reports.url_id} = ${urls.id} and ${reports.status} in ('open', 'reviewing'))`
    );
  const where = filters.length ? and(...filters) : undefined;
  const db = useDrizzle(event.context.cloudflare.env.DB);
  const base = db
    .select({ id: urls.id })
    .from(urls)
    .innerJoin(usersToUrls, eq(urls.id, usersToUrls.url))
    .innerJoin(users, eq(usersToUrls.user, users.id))
    .where(where);
  const [items, totals] = await Promise.all([
    db
      .select({
        id: urls.id,
        uid: urls.uid,
        forward: urls.forward,
        created_at: urls.created_at,
        expires: urls.expires,
        ownerId: users.id,
        ownerName: users.name,
        ownerEmail: users.email,
        reportCount: sql<number>`(select count(*) from ${reports} where ${reports.url_id} = ${urls.id} and ${reports.status} in ('open', 'reviewing'))`,
      })
      .from(urls)
      .innerJoin(usersToUrls, eq(urls.id, usersToUrls.url))
      .innerJoin(users, eq(usersToUrls.user, users.id))
      .where(where)
      .orderBy(desc(urls.created_at))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(base.as('filtered_urls')),
  ]);
  return { items, page, pageSize, total: Number(totals[0]?.value ?? 0) };
});
