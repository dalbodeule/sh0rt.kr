import handleLoginUser from "~/server/routes/handleLoginUser";

export default defineOAuthGitHubEventHandler({
    config: {
        emailRequired: true
    },
    async onSuccess(event, { user }) {
        await handleLoginUser(event, "github", {
            email: user.email ?? 'none@example.com',
            name: user.login,
            avatar_url: user.avatar_url,
            accountId: `${user.id}`,
        })

        return sendRedirect(event, '/')
    }
})