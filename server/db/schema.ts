import { sqliteTable, int, text, index, uniqueIndex } from "drizzle-orm/sqlite-core"
import {sql, relations } from "drizzle-orm";
import { UserRole } from '~/common/userRole'
export { UserRole } from '~/common/userRole'

export const users = sqliteTable('users', {
    id: int('id').primaryKey({ autoIncrement: true }),
    email: text('email', { length: 255 }).notNull(),
    vendor: text('vendor', { length: 20 }).notNull(),
    name: text('name', { length: 20 }).notNull(),
    token: text('token', { length: 255 }).notNull(),
    profile: text('profile', { length: 4096 }).notNull(),
    created_at: int('created_at', { mode: "timestamp" }).notNull().default(sql`(STRFTIME('%s'))`),
    updated_at: int('updated_at', { mode: "timestamp" }).notNull().default(sql`(STRFTIME('%s'))`),
    login_limit: int('login_limit', { mode: "timestamp" }),
    role: int('role').notNull().default(UserRole.USER),
}, (table) => [
    uniqueIndex('users_vendor_token_unique').on(table.vendor, table.token),
])

export const usersRelations = relations(users, ({ many }) => ({
    usersToUrls: many(usersToUrls),
}))

export const urls = sqliteTable('urls', {
    id: int('id').primaryKey({ autoIncrement: true }),
    uid: text('uid', { length: 20 }).notNull(),
    manage_id: text('manage_id', { length: 36 }).notNull(),
    forward: text('forward', { length: 4096 }).notNull(),
    created_at: int('created_at', { mode: "timestamp" }).notNull().default(sql`(STRFTIME('%s'))`),
    updated_at: int('updated_at', { mode: "timestamp" }).notNull().default(sql`(STRFTIME('%s'))`),
    expires: int('expires', { mode: "timestamp" }).notNull().default(sql`(STRFTIME('%s'))`),
}, (table) => [
    uniqueIndex('urls_uid_unique').on(table.uid),
    uniqueIndex('urls_manage_id_unique').on(table.manage_id),
    index('urls_expires_idx').on(table.expires),
])

export const urlsRelations = relations(urls, ({ many }) => ({
    UsersToUrls: many(usersToUrls)
}))

export const usersToUrls = sqliteTable('userToUrls', {
    user: int('user').notNull().references(() => users.id),
    url: int('url').notNull().references(() => urls.id),
}, (table) => [
    uniqueIndex('user_to_urls_unique').on(table.user, table.url),
    index('user_to_urls_user_idx').on(table.user),
])

export const usersToUrlsRelations = relations(usersToUrls, ({ one }) => ({
    Users: one(users, {
        fields: [usersToUrls.user],
        references: [users.id]
    }),
    Urls: one(urls, {
        fields: [usersToUrls.url],
        references: [urls.id]
    })
}))

export const analyticsCache = sqliteTable('analyticsCache', {
    id: int('id').primaryKey({ autoIncrement: true }),
    uid: text('uid', { length: 20 }).notNull(),
    data: text('data').notNull(),
    created_at: int('created_at', { mode: 'timestamp' }).default(sql`(STRFTIME('%s'))`),
}, (table) => [
    uniqueIndex('analytics_cache_uid_unique').on(table.uid),
])
