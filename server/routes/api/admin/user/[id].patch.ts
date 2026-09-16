import { eq } from 'drizzle-orm'
import { UserRole, users } from '~/server/db/schema'
import { useDrizzle } from '~/server/utils/useDrizzle'
import { requireRole } from '~/server/utils/requireRole'

export default defineEventHandler(async (event) => {
    const admin = await requireRole(event, UserRole.ADMIN)
    const id = Number(getRouterParam(event, 'id'))
    const body = await readBody<{ role?: number, suspended?: boolean }>(event)
    if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, statusMessage: 'Invalid user id' })
    if (id === admin.id) throw createError({ statusCode: 400, statusMessage: 'You cannot modify your own account' })

    const updates: { role?: UserRole, login_limit?: Date | null, updated_at: Date } = { updated_at: new Date() }
    if (body.role !== undefined) {
        if (![UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN].includes(body.role)) {
            throw createError({ statusCode: 400, statusMessage: 'Invalid role' })
        }
        updates.role = body.role
    }
    if (body.suspended !== undefined) {
        updates.login_limit = body.suspended ? new Date('2099-12-31T23:59:59.000Z') : null
    }

    const db = useDrizzle(event.context.cloudflare.env.DB)
    const changed = await db.update(users).set(updates).where(eq(users.id, id)).returning({ id: users.id })
    if (!changed.length) throw createError({ statusCode: 404, statusMessage: 'User not found' })
    return { success: true }
})
