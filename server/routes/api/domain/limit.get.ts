import getLimits from "~/server/utils/getLimits";

export default defineEventHandler(async (event) => {
    const user = await requireUserSession(event)
    if (!user) throw createError({
        status: 403,
        statusMessage: "Invalid authentication",
    })

    return await getLimits(event)
})