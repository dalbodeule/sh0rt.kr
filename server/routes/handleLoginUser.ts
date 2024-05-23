import { drizzle } from "drizzle-orm/d1";
import getDB from "~/server/getDB";
import { Users } from "~/db";
import { and, eq } from "drizzle-orm";
import { H3Event } from "h3";

export default async function(event: H3Event, provider: string, user: {
    accountId: string,
    email: string,
    name: string,
    avatar_url: string,
} ) {
    const db = drizzle(await getDB(event))

    let db_user = await db.select().from(Users).where(and(
        eq(Users.token, user.accountId),
        eq(Users.vendor, provider)
    ))

    if (db_user.length > 0) {
        await db.update(Users).set({
            updated_at: new Date(),
            name: user.name
        }).where(and(
            eq(Users.token, user.accountId),
            eq(Users.vendor, provider)
        ))
    } else {
        const email = user.email
        const profile = user.avatar_url
        const name = user.name

        await db.insert(Users).values({
            email,
            name,
            vendor: provider,
            token: user.accountId,
            profile
        })
    }

    db_user = await db.select().from(Users).where(and(
        eq(Users.token, user.accountId),
        eq(Users.vendor, provider)
    ))

    if(db_user.length != 1 && (db_user[0].login_limit?.getTime() ?? 0 < new Date().getTime()))
        return

    await setUserSession(event, {
        user: {
            id: db_user[0].id,
            email: db_user[0].email,
            name: db_user[0].name,
            vendor: db_user[0].vendor,
            profile: db_user[0].profile,
            created_at: db_user[0].created_at,
            updated_at: db_user[0].updated_at,
            role: db_user[0].role,
        }
    })
}