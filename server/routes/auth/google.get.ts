import handleLoginUser from "~/server/routes/handleLoginUser";

export default oauthGoogleEventHandler({
    config: {
        scope: ['email', 'openid', 'profile'],
        redirectURL: "http://localhost:3000/auth/google",
    },
    async onSuccess(event, { user }) {
        await handleLoginUser(event, "google", {
            email: user.email,
            name: user.name,
            avatar_url: user.picture,
            accountId: user.sub,
        })

        return sendRedirect(event, '/')
    },
    async onError(event, error) {
        console.log(error)
        return sendRedirect(event, '/')
    }
})