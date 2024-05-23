import { Users } from "~/db";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import getDB from '../../miniflare'

const provider = 'github'

export default oauth.githubEventHandler({
    config: {
        emailRequired: true
    },
    async onSuccess(event, { user }) {
        const db = drizzle(await getDB(event))

        const accountId = user.id

        let db_user = await db.select().from(Users).where(and(
            eq(Users.token, accountId),
            eq(Users.vendor, provider)
        ))

        if(db_user.length > 0) {
            await db.update(Users).set({updated_at: new Date()}).where(and(
                eq(Users.token, accountId),
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
                token: accountId,
                profile
            })

            db_user = await db.select().from(Users).where(and(
                eq(Users.token, accountId),
                eq(Users.vendor, provider)
            ))
        }

        console.log(db_user[0])
        await setUserSession(event, {
            user: {
                id: db_user[0].id,
                email: db_user[0].email,
                name: db_user[0].name,
                vendor: db_user[0].vendor,
                profile: db_user[0].profile,
                created_at: db_user[0].created_at,
                updated_at: new Date(),
            }
        })

        return sendRedirect(event, '/')
    }
})