import handleLoginUser from '~/server/routes/handleLoginUser';

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'openid', 'profile'],
  },
  async onSuccess(event, { user }) {
    const accepted = await handleLoginUser(event, 'google', {
      email: user.email,
      name: user.name,
      avatar_url: user.picture,
      accountId: user.sub,
    });

    return sendRedirect(event, accepted ? '/' : '/login?restricted=1');
  },
  async onError(event, error) {
    console.log(error);
    return sendRedirect(event, '/');
  },
});
