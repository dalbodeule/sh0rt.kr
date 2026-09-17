export default defineNuxtPlugin((nuxtApp) => {
  const session = useUserSession();
  const { $csrfFetch } = useNuxtApp();
  const { show } = useAppNotice();
  nuxtApp.hook('app:mounted', async () => {
    try {
      if (!session.ready.value) await session.fetch();
    } catch (error) {
      console.error('Failed to initialize the user session.', error);
      return;
    }

    if (!session.loggedIn.value) return;
    try {
      await $fetch('/api/session/status');
    } catch (error: unknown) {
      const status =
        (error as { response?: { status?: number }; statusCode?: number }).response?.status ??
        (error as { statusCode?: number }).statusCode;
      if (status !== 403) return;
      await $csrfFetch('/api/_auth/session', { method: 'DELETE' });
      session.session.value = null;
      show(nuxtApp.$i18n.t('session.restricted'), 'error');
      await navigateTo('/login');
    }
  });
});
