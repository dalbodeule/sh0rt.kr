import handleLoginUser from "~/server/routes/handleLoginUser";

export default oauth.githubEventHandler({
    config: {
        emailRequired: true
    },
    async onSuccess(event, { user }) {
        await handleLoginUser(event, "github", {
            email: user.email,
            name: user.login,
            avatar_url: user.avatar_url,
            accountId: user.id,
        })

        return sendRedirect(event, '/')
    }
})