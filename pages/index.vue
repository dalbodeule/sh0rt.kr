<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faChartColumn, faLink, faQrcode } from '@fortawesome/free-solid-svg-icons';
const { loggedIn } = useUserSession();
const { t } = useI18n();
interface PublicStats {
  users: number;
  urls: number;
  activeUrls: number;
  updatedAt: string;
}
const { data: globalStats } = await useFetch<PublicStats>('/api/stats');
useSeoMeta({
  title: 'sh0rt.kr',
  description: t('home.description'),
  robots: { all: true },
  ogType: 'website',
  ogSiteName: 'sh0rt.kr',
  ogImage: '/favicon.png',
});
const features = computed(() => [
  {
    icon: faLink,
    title: t('home.features.share'),
    description: t('home.features.shareDescription'),
  },
  {
    icon: faChartColumn,
    title: t('home.features.analytics'),
    description: t('home.features.analyticsDescription'),
  },
  {
    icon: faQrcode,
    title: t('home.features.qr'),
    description: t('home.features.qrDescription'),
  },
]);
</script>

<template>
  <main class="space-y-16 pb-10 pt-4 sm:pt-8">
    <section
      class="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-16 text-white shadow-xl sm:px-12 sm:py-24"
    >
      <div class="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
      <div class="absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
      <div class="relative mx-auto max-w-3xl text-center">
        <p class="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
          {{ t('home.eyebrow') }}
        </p>
        <h1 class="text-4xl font-black tracking-tight sm:text-6xl">
          {{ t('home.headline').split('|')[0] }}<br class="hidden sm:block" />
          {{ t('home.headline').split('|')[1] }}
        </h1>
        <p class="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
          {{ t('home.intro') }}
        </p>
        <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <NuxtLink
            :to="loggedIn ? '/create' : '/login'"
            class="rounded-xl bg-blue-500 px-6 py-3 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-blue-400"
            >{{ loggedIn ? t('home.newLink') : t('home.start') }}</NuxtLink
          ><NuxtLink
            v-if="loggedIn"
            to="/manage"
            class="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold text-white hover:bg-white/15"
            >{{ t('home.manage') }}</NuxtLink
          >
        </div>
      </div>
    </section>
    <section
      v-if="globalStats"
      :aria-label="t('home.status')"
      class="grid gap-4 rounded-3xl bg-blue-50 p-6 sm:grid-cols-3 sm:p-8"
    >
      <article
        v-for="item in [
          [t('home.users'), globalStats.users],
          [t('home.urls'), globalStats.urls],
          [t('home.activeUrls'), globalStats.activeUrls],
        ]"
        :key="String(item[0])"
        class="text-center"
      >
        <p class="text-3xl font-black text-blue-700">{{ Number(item[1]).toLocaleString() }}</p>
        <p class="mt-1 text-sm font-semibold text-slate-600">{{ item[0] }}</p>
      </article>
    </section>
    <section>
      <div class="mx-auto max-w-2xl text-center">
        <p class="text-sm font-semibold text-blue-600">WHY SH0RT.KR</p>
        <h2 class="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {{ t('home.why') }}
        </h2>
      </div>
      <div class="mt-8 grid gap-5 md:grid-cols-3">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
          >
            <FontAwesomeIcon :icon="feature.icon" class="h-5 w-5" />
          </div>
          <h3 class="mt-5 text-lg font-bold text-slate-950">{{ feature.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-slate-600">{{ feature.description }}</p>
        </article>
      </div>
    </section>
  </main>
</template>
