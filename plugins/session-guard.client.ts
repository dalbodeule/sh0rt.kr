export default defineNuxtPlugin((nuxtApp) => {
  const session = useUserSession();
  nuxtApp.hook('app:mounted', async () => {
    await session.fetch();
    if (!session.loggedIn.value) return;
    try {
      await $fetch('/api/session/status');
    } catch (error: unknown) {
      const status =
        (error as { response?: { status?: number }; statusCode?: number }).response?.status ??
        (error as { statusCode?: number }).statusCode;
      if (status !== 403) return;
      await session.clear();
      window.alert('계정 제한 상태이므로 접속할 수 없습니다. 자동으로 로그아웃되었습니다.');
      await navigateTo('/login');
    }
  });
});
