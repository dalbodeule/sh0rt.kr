import handleLoginUser from '~/server/routes/handleLoginUser';

export default defineOAuthTwitchEventHandler({
  config: { emailRequired: true },
  async onSuccess(event, { user }) {
    if (!user.email)
      throw createError({ statusCode: 400, statusMessage: 'Twitch email is required' });
    const accepted = await handleLoginUser(event, 'twitch', {
      email: user.email,
      name: user.display_name || user.login,
      avatar_url: user.profile_image_url,
      accountId: user.id,
    });
    return sendRedirect(event, accepted ? '/' : '/login?restricted=1');
  },
});
