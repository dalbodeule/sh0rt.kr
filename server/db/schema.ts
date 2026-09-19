import { sqliteTable, int, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';
import { UserRole } from '~/common/userRole';
export { UserRole } from '~/common/userRole';

export const users = sqliteTable(
  'users',
  {
    id: int('id').primaryKey({ autoIncrement: true }),
    email: text('email', { length: 255 }).notNull(),
    vendor: text('vendor', { length: 20 }).notNull(),
    name: text('name', { length: 20 }).notNull(),
    token: text('token', { length: 255 }).notNull(),
    profile: text('profile', { length: 4096 }).notNull(),
    created_at: int('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(STRFTIME('%s'))`),
    updated_at: int('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(STRFTIME('%s'))`),
    login_limit: int('login_limit', { mode: 'timestamp' }),
    role: int('role').notNull().default(UserRole.USER),
  },
  (table) => [uniqueIndex('users_vendor_token_unique').on(table.vendor, table.token)]
);

export const usersRelations = relations(users, ({ many }) => ({
  usersToUrls: many(usersToUrls),
}));

export const urls = sqliteTable(
  'urls',
  {
    id: int('id').primaryKey({ autoIncrement: true }),
    tld: text('tld', { length: 255 }).notNull(),
    uid: text('uid', { length: 20 }).notNull(),
    manage_id: text('manage_id', { length: 36 }).notNull(),
    forward: text('forward', { length: 4096 }).notNull(),
    created_at: int('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(STRFTIME('%s'))`),
    updated_at: int('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(STRFTIME('%s'))`),
    expires: int('expires', { mode: 'timestamp' })
      .notNull()
      .default(sql`(STRFTIME('%s'))`),
  },
  (table) => [
    uniqueIndex('urls_tld_uid_unique').on(table.tld, table.uid),
    uniqueIndex('urls_manage_id_unique').on(table.manage_id),
    index('urls_expires_idx').on(table.expires),
  ]
);

export const urlsRelations = relations(urls, ({ many }) => ({
  UsersToUrls: many(usersToUrls),
}));

export const urlBlacklist = sqliteTable(
  'urlBlacklist',
  {
    id: int('id').primaryKey({ autoIncrement: true }),
    uid: text('uid', { length: 20 }).notNull(),
    reason: text('reason', { length: 500 }).notNull().default(''),
    created_by: int('created_by')
      .notNull()
      .references(() => users.id),
    created_at: int('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(STRFTIME('%s'))`),
  },
  (table) => [
    uniqueIndex('url_blacklist_uid_unique').on(table.uid),
    index('url_blacklist_created_at_idx').on(table.created_at),
  ]
);

export const usersToUrls = sqliteTable(
  'userToUrls',
  {
    user: int('user')
      .notNull()
      .references(() => users.id),
    url: int('url')
      .notNull()
      .references(() => urls.id),
  },
  (table) => [
    uniqueIndex('user_to_urls_unique').on(table.user, table.url),
    index('user_to_urls_user_idx').on(table.user),
  ]
);

export const usersToUrlsRelations = relations(usersToUrls, ({ one }) => ({
  Users: one(users, {
    fields: [usersToUrls.user],
    references: [users.id],
  }),
  Urls: one(urls, {
    fields: [usersToUrls.url],
    references: [urls.id],
  }),
}));

export const analyticsCache = sqliteTable(
  'analyticsCache',
  {
    id: int('id').primaryKey({ autoIncrement: true }),
    manage_id: text('manage_id', { length: 36 }),
    tld: text('tld', { length: 255 }).notNull(),
    uid: text('uid', { length: 20 }).notNull(),
    data: text('data').notNull(),
    created_at: int('created_at', { mode: 'timestamp' }).default(sql`(STRFTIME('%s'))`),
  },
  (table) => [uniqueIndex('analytics_cache_manage_id_unique').on(table.manage_id)]
);

export const reports = sqliteTable(
  'reports',
  {
    id: int('id').primaryKey({ autoIncrement: true }),
    url_id: int('url_id'),
    tld: text('tld', { length: 255 }),
    uid: text('uid', { length: 20 }),
    forward: text('forward', { length: 4096 }),
    reporter_email: text('reporter_email', { length: 255 }),
    reason: text('reason', { length: 50 }).notNull(),
    details: text('details', { length: 5000 }).notNull().default(''),
    source: text('source', { length: 10 }).notNull().default('web'),
    sender: text('sender', { length: 255 }),
    subject: text('subject', { length: 500 }),
    body_text: text('body_text', { length: 20000 }),
    status: text('status', { length: 20 }).notNull().default('open'),
    created_at: int('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(STRFTIME('%s'))`),
    updated_at: int('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(STRFTIME('%s'))`),
  },
  (table) => [
    index('reports_status_idx').on(table.status),
    index('reports_uid_idx').on(table.uid),
    index('reports_created_at_idx').on(table.created_at),
    index('reports_url_id_idx').on(table.url_id),
  ]
);

export const globalStats = sqliteTable('globalStats', {
  id: int('id').primaryKey(),
  data: text('data').notNull(),
  updated_at: int('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(STRFTIME('%s'))`),
});
