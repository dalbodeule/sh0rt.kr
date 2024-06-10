import bcrypt from 'bcryptjs'
import sha256 from "~/server/utils/sha256";
import { users } from "~/server/db/schema";

export interface IDDNSKeyPost {
    password: string,
    password2: string,
}

export default defineEventHandler(async (event) => {
    const user = await requireUserSession(event)
    if(!user) throw createError({
        status: 403,
        statusMessage: "Invalid authentication",
    })

    const body = await readBody(event) as IDDNSKeyPost
    if(!body.password || !body.password2 || body.password != body.password2) throw createError({
        status: 403,
        message: 'Body is wrong',
    })

    const db = useDrizzle()
    const salt = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(await sha256(body.password), salt)

    await db.update(users).set({
        ddns_key: hashedPassword
    }).where(eq(users.id, user.user.id))

    return { success: true }
})