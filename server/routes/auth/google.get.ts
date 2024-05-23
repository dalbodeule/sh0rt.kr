import handleLoginUser from "~/server/routes/handleLoginUser";

export default oauth.googleEventHandler({
    config: {
        scope: ['email', 'openid', 'profile']
    },
    async onSuccess(event, { user }) {
        await handleLoginUser(event, "google", {
            email: user.email,
            name: user.name,
            avatar_url: user.picture,
            accountId: user.sub,
        })

        return sendRedirect(event, '/')
    }
})