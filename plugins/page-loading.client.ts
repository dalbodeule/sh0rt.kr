export default defineNuxtPlugin((nuxtApp) => {
  const isPageLoading = useState('page-loading', () => false);

  nuxtApp.hook('page:start', () => {
    isPageLoading.value = true;
  });

  nuxtApp.hook('page:finish', () => {
    isPageLoading.value = false;
  });
});
