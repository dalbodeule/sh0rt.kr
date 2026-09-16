import handleLoginUser from "~/server/routes/handleLoginUser";

export default defineOAuthGitHubEventHandler({
    config: {
        emailRequired: true
    },
    async onSuccess(event, { user }) {
        if (!user.email) throw createError({ statusCode: 400, statusMessage: 'GitHub email is required' })
        await handleLoginUser(event, "github", {
            email: user.email,
            name: user.login,
            avatar_url: user.avatar_url,
            accountId: `${user.id}`,
        })

        return sendRedirect(event, '/')
    }
})
