const SESSION_REFRESH_INTERVAL = 60 * 60 * 24 * 1000;

export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session, event) => {
    if (!session.user) return;

    const now = Date.now();
    const refreshedAt = session.secure?.refreshedAt;
    if (typeof refreshedAt === 'number' && now - refreshedAt < SESSION_REFRESH_INTERVAL) return;

    const { id: _sessionId, ...data } = session;

    // Reissuing the cookie resets its 30-day Max-Age. The encrypted session still
    // has a separate one-year absolute lifetime configured in nuxt.config.ts.
    await setUserSession(event, {
      ...data,
      secure: {
        ...data.secure,
        refreshedAt: now,
      },
    });
  });
});
