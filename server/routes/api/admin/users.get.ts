import { and, asc, count, desc, eq, gte, like, lte, or, sql, type SQL } from 'drizzle-orm';
import { UserRole, users, usersToUrls } from '~/server/db/schema';
import { getPagination } from '~/server/utils/pagination';
import { requireRole } from '~/server/utils/requireRole';
import { useDrizzle } from '~/server/utils/useDrizzle';

export default defineEventHandler(async (event) => {
  await requireRole(event, UserRole.MODERATOR);
  const query = getQuery(event);
  const { page, pageSize, offset } = getPagination(query);
  const filters: SQL[] = [];
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 200) : '';
  if (q) {
    const term = `%${q.toLowerCase()}%`;
    filters.push(
      or(like(sql`lower(${users.name})`, term), like(sql`lower(${users.email})`, term))!
    );
  }
  if (typeof query.vendor === 'string' && query.vendor)
    filters.push(eq(users.vendor, query.vendor));
  const joinedFrom =
    typeof query.joinedFrom === 'string' ? new Date(`${query.joinedFrom}T00:00:00`) : null;
  const joinedTo =
    typeof query.joinedTo === 'string' ? new Date(`${query.joinedTo}T23:59:59.999`) : null;
  if (joinedFrom && !Number.isNaN(joinedFrom.getTime()))
    filters.push(gte(users.created_at, joinedFrom));
  if (joinedTo && !Number.isNaN(joinedTo.getTime())) filters.push(lte(users.created_at, joinedTo));
  if (query.status === 'suspended') filters.push(gte(users.login_limit, new Date()));
  if (query.status === 'active')
    filters.push(or(sql`${users.login_limit} is null`, lte(users.login_limit, new Date()))!);
  const where = filters.length ? and(...filters) : undefined;
  const db = useDrizzle(event.context.cloudflare.env.DB);
  const [items, totals] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        vendor: users.vendor,
        profile: users.profile,
        created_at: users.created_at,
        login_limit: users.login_limit,
        role: users.role,
        urlCount: count(usersToUrls.url),
      })
      .from(users)
      .leftJoin(usersToUrls, eq(users.id, usersToUrls.user))
      .where(where)
      .groupBy(users.id)
      .orderBy(desc(users.created_at), asc(users.id))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(users).where(where),
  ]);
  return { items, page, pageSize, total: Number(totals[0]?.value ?? 0) };
});
