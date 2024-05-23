import { sqliteTable, int, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export enum UserRole {
    ADMIN = 2,
    MODERATOR = 1,
    USER = 0
}

const Users = sqliteTable('users', {
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

const Urls = sqliteTable('urls', {
    id: int('id').primaryKey({ autoIncrement: true }),
    uid: text('uid', { length: 10 }).notNull(),
    forward: text('forward', { length: 4096 }).notNull(),
    user: int('user').references(() => Users.id),
    created_at: int('created_at', { mode: "timestamp" }).notNull().default(sql`(STRFTIME('%s'))`),
    updated_at: int('updated_at', { mode: "timestamp" }).notNull().default(sql`(STRFTIME('%s'))`),
    expires: int('expires', { mode: "timestamp" }).notNull().default(sql`(STRFTIME('%s'))`),
})

export { Users, Urls }