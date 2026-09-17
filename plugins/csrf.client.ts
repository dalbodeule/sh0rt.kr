const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export default defineNuxtPlugin(async () => {
  const csrfToken = useCookie<string | null>('csrf-token');
  if (!csrfToken.value) {
    try {
      const response = await $fetch<{ token: string }>('/api/csrf-token');
      csrfToken.value = response.token;
    } catch (error) {
      console.error('Failed to initialize the CSRF token.', error);
    }
  }

  const csrfFetch = $fetch.create({
    onRequest({ options }) {
      if (!STATE_CHANGING_METHODS.has(String(options.method ?? 'GET').toUpperCase())) return;

      const headers = new Headers(options.headers as HeadersInit | undefined);
      if (csrfToken.value) headers.set('X-CSRF-Token', csrfToken.value);
      options.headers = headers;
    },
  });

  return {
    provide: { csrfFetch },
  };
});
