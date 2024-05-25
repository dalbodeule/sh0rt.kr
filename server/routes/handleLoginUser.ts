import { drizzle } from "drizzle-orm/d1";
import getDB from "~/server/getDB";
import { and, eq } from "drizzle-orm";
import { H3Event } from "h3";
import {users} from "~/db/schema";

export default async function(event: H3Event, provider: string, user: {
    accountId: string,
    email: string,
    name: string,
    avatar_url: string,
} ) {
    const db = getDB(event)

    let db_user = await db.query.users.findFirst({
        where: and(
            eq(users.token, user.accountId),
            eq(users.vendor, provider))
    })

    if (db_user) {
        await db.update(users).set({
            updated_at: new Date(),
            name: user.name
        }).where(and(
            eq(users.token, user.accountId),
            eq(users.vendor, provider)
        ))
    } else {
        const email = user.email
        const profile = user.avatar_url
        const name = user.name

        await db.insert(users).values({
            email,
            name,
            vendor: provider,
            token: user.accountId,
            profile
        })
    }

    db_user = await db.query.users.findFirst({
        where: and(
            eq(users.token, user.accountId),
            eq(users.vendor, provider))
    })

    if(!db_user || (db_user.login_limit?.getTime() ?? 0 > Math.round(Date.now() / 1000))) {
        console.log("asdfs")
        return
    }

    await setUserSession(event, {
        user: {
            id: db_user!!.id,
            email: db_user!!.email,
            name: db_user!!.name,
            vendor: db_user!!.vendor,
            profile: db_user!!.profile,
            created_at: db_user!!.created_at,
            updated_at: db_user!!.updated_at,
            role: db_user!!.role,
        }
    })
}