import { UserRole } from '~/server/db/schema'
import { useDrizzle } from '~/server/utils/useDrizzle'
import { requireRole } from '~/server/utils/requireRole'

export default defineEventHandler(async (event) => {
    await requireRole(event, UserRole.MODERATOR)
    const db = useDrizzle(event.context.cloudflare.env.DB)
    const userRows = await db.query.users.findMany({
        columns: {
            id: true, email: true, name: true, vendor: true, profile: true,
            created_at: true, updated_at: true, login_limit: true, role: true,
        },
        with: { usersToUrls: { with: { Urls: true } } },
    })

    const users = userRows.map(({ usersToUrls, ...user }) => ({ ...user, urlCount: usersToUrls.length }))
    const urls = userRows.flatMap((user) => user.usersToUrls.map(({ Urls }) => ({
        ...Urls,
        owner: { id: user.id, name: user.name, email: user.email },
    })))

    return {
        stats: {
            users: users.length,
            urls: urls.length,
            activeUrls: urls.filter((url) => url.expires.getTime() > Date.now()).length,
        },
        users,
        urls,
    }
})
