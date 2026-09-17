<script setup lang="ts">
const { t } = useI18n();
const { show } = useAppNotice();
const methods = computed(() => [
  { url: '/auth/google', display: t('loginPage.google'), image: '/google.png' },
  { url: '/auth/github', display: t('loginPage.github'), image: '/github.png' },
  { url: '/auth/twitch', display: t('loginPage.twitch'), image: '/twitch.png' },
  { url: '/auth/chzzk', display: t('loginPage.chzzk'), image: '/chzzk.png' },
]);
const route = useRoute();
onMounted(() => {
  if (route.query.restricted === '1') show(t('loginPage.restricted'), 'error');
});
useSeoMeta({
  title: t('loginPage.title'),
  description: t('loginPage.title'),
  robots: { all: false },
});
</script>

<template>
  <main class="mx-auto flex min-h-[65vh] max-w-md items-center py-10">
    <section
      class="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8"
    >
      <div class="text-center">
        <img src="/favicon.png" alt="" class="mx-auto h-14 w-14 rounded-2xl" />
        <h1 class="mt-5 text-2xl font-black text-slate-950">{{ t('loginPage.title') }}</h1>
        <p class="mt-2 text-sm leading-6 text-slate-500">
          {{ t('loginPage.description') }}
        </p>
      </div>
      <div class="mt-8 space-y-3">
        <a
          v-for="method in methods"
          :key="method.url"
          :href="method.url"
          class="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          ><img v-if="method.image" :src="method.image" class="h-5 w-5 rounded" alt="" />{{
            method.display
          }}</a
        >
      </div>
      <p class="mt-6 text-center text-xs leading-5 text-slate-400">
        {{
          t('loginPage.consent', { terms: t('loginPage.terms'), privacy: t('loginPage.privacy') })
        }}
      </p>
    </section>
  </main>
</template>
