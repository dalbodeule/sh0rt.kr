import { sqliteTable, int, text } from "drizzle-orm/sqlite-core"
import {sql, relations } from "drizzle-orm";

export enum UserRole {
    ADMIN = 2,
    MODERATOR = 1,
    USER = 0
}

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
})

export const usersRelations = relations(users, ({ many }) => ({
    usersToUrls: many(usersToUrls)
}))

export const urls = sqliteTable('urls', {
    id: int('id').primaryKey({ autoIncrement: true }),
    uid: text('uid', { length: 10 }).notNull(),
    forward: text('forward', { length: 4096 }).notNull(),
    created_at: int('created_at', { mode: "timestamp" }).notNull().default(sql`(STRFTIME('%s'))`),
    updated_at: int('updated_at', { mode: "timestamp" }).notNull().default(sql`(STRFTIME('%s'))`),
    expires: int('expires', { mode: "timestamp" }).notNull().default(sql`(STRFTIME('%s'))`),
})

export const urlsRelations = relations(urls, ({ many }) => ({
    UsersToUrls: many(usersToUrls)
}))

export const usersToUrls = sqliteTable('userToUrls', {
    user: int('user').notNull().references(() => users.id),
    url: int('url').notNull().references(() => urls.id),
})

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
    uid: text('uid', { length: 10 }).notNull(),
    data: text('data').notNull(),
    created_at: int('created_at', { mode: 'timestamp' }).default(sql`(STRFTIME('%s'))`),
})