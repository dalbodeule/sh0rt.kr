import {sqliteTable, int, text} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const Users = sqliteTable('users', {
    id: int('id').primaryKey({ autoIncrement: true }),
    email: text('email', { length: 255 }).notNull(),
    vendor: text('vendor', { length: 20 }).notNull(),
    name: text('name', { length: 20 }).notNull(),
    token: text('token', { length: 255 }).notNull(),
    profile: text('profile', { length: 4096 }).notNull(),
    created_at: int('created_at', { mode: "timestamp" }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: int('updated_at', { mode: "timestamp" }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
})

export { Users }