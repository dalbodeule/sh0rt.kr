<script setup lang="ts">
import { GChart } from 'vue-google-charts';
import type { GoogleChartWrapperChartType } from 'vue-google-charts/dist/types';
import dayjs from 'dayjs';
import { Status } from '~/common/enums';
import type { IUIDPostRequest } from '~/server/routes/api/forward/index.post';
import type { IAnalyticsResponse, IManageResponse } from '~/server/routes/api/manage/[id].get';

const route = useRoute();
const { t } = useI18n();
const { $csrfFetch } = useNuxtApp();
const manageId = String(route.params.id);
const { loggedIn } = useUserSession();
if (!loggedIn.value) await navigateTo('/');

let managed: IManageResponse;
try {
  managed = await useRequestFetch()<IManageResponse>(`/api/manage/${manageId}`);
} catch {
  throw createError({ statusCode: 404, statusMessage: '관리할 단축주소를 찾을 수 없습니다.' });
}

const uid = managed.link.uid;
const publicBaseUrl = `https://${managed.link.tld}`;
const addrInfo = ref<IUIDPostRequest>({
  tld: managed.link.tld,
  uid,
  forward: managed.link.forward,
  expires: dayjs(managed.link.expires).format('YYYY-MM-DD'),
  token: '',
});
const status = ref(Status.DEFAULT);
const errorMessage = ref('');
const analytics = ref<IAnalyticsResponse | null>(managed.analytics);
const deleting = ref(false);
provide('addrInfo', addrInfo);
provide('status', status);

const onSubmit = async () => {
  status.value = Status.PENDING;
  errorMessage.value = '';
  try {
    await $csrfFetch(`/api/manage/${manageId}` as string, {
      method: 'PATCH',
      body: addrInfo.value,
    });
    status.value = Status.SUCCESS;
  } catch (error: unknown) {
    status.value = Status.ERROR;
    errorMessage.value = error instanceof Error ? error.message : t('create.error');
  }
};

const onDelete = async () => {
  if (!window.confirm(t('manage.deleteConfirm'))) return;
  deleting.value = true;
  try {
    await $csrfFetch(`/api/manage/${manageId}` as string, { method: 'DELETE' });
    await navigateTo('/manage');
  } catch (error: unknown) {
    deleting.value = false;
    errorMessage.value = error instanceof Error ? error.message : t('manage.deleteError');
    status.value = Status.ERROR;
  }
};

const chartOptions = {
  chartArea: { width: '82%', height: '72%' },
  legend: { position: 'bottom' },
  backgroundColor: 'transparent',
};
const hasRows = (data?: [string, string | number][]) => Boolean(data && data.length > 1);
const charts = computed<
  { key: keyof IAnalyticsResponse; title: string; type: GoogleChartWrapperChartType }[]
>(() => [
  { key: 'country', title: t('detail.country'), type: 'GeoChart' },
  { key: 'browser', title: t('detail.browser'), type: 'PieChart' },
  { key: 'os', title: t('detail.os'), type: 'PieChart' },
  { key: 'device', title: t('detail.device'), type: 'PieChart' },
  { key: 'language', title: t('detail.language'), type: 'PieChart' },
  { key: 'requestDomain', title: t('detail.requestDomain'), type: 'PieChart' },
  { key: 'requestPath', title: t('detail.requestPath'), type: 'PieChart' },
  { key: 'sourceDomain', title: t('detail.sourceDomain'), type: 'PieChart' },
  { key: 'sourcePath', title: t('detail.sourcePath'), type: 'PieChart' },
]);

useSeoMeta({
  title: `sh0rt.kr :: /${uid} 관리`,
  description: t('detail.stats'),
  robots: { all: false },
});
</script>

<template>
  <main class="space-y-6 py-4 sm:py-8">
    <header>
      <p class="text-sm font-semibold text-blue-600">LINK MANAGEMENT</p>
      <h1 class="mt-1 break-all text-3xl font-black tracking-tight text-slate-950">
        /{{ uid }} 관리
      </h1>
      <a
        :href="`${publicBaseUrl}/${uid}`"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-2 inline-block break-all text-sm text-blue-600 hover:underline"
        >{{ publicBaseUrl }}/{{ uid }} ↗</a
      >
    </header>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 class="mb-6 text-xl font-bold">{{ t('detail.settings') }}</h2>
      <ShorterField
        :submit-text="t('detail.save')"
        :is-new="false"
        :lock="false"
        @submit="onSubmit"
      />
      <p
        v-if="status === Status.SUCCESS"
        class="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
      >
        {{ t('detail.saved') }}
      </p>
      <p
        v-if="status === Status.ERROR"
        role="alert"
        class="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
      >
        {{ errorMessage }}
      </p>
      <button
        type="button"
        class="mt-5 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        :disabled="deleting"
        @click="onDelete"
      >
        {{ deleting ? t('manage.deleting') : t('manage.delete') }}
      </button>
    </section>

    <ClientOnly>
      <QRCodeGenerator :value="`${publicBaseUrl}/${uid}`" />
      <template #fallback><div class="h-80 animate-pulse rounded-2xl bg-slate-100" /></template>
    </ClientOnly>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div class="mb-6">
        <h2 class="text-xl font-bold">{{ t('detail.stats') }}</h2>
        <p class="mt-1 text-sm text-slate-500">
          {{ t('detail.statsDescription') }}
        </p>
      </div>
      <div v-if="analytics" class="grid gap-5 lg:grid-cols-2">
        <article
          v-for="chart in charts"
          :key="chart.key"
          class="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3"
        >
          <h3 class="px-2 pt-2 text-sm font-bold text-slate-700">{{ chart.title }}</h3>
          <ClientOnly>
            <GChart
              v-if="hasRows(analytics[chart.key])"
              :type="chart.type"
              :data="analytics[chart.key]"
              :settings="{ packages: chart.type === 'GeoChart' ? ['geochart'] : ['corechart'] }"
              :options="chartOptions"
              class="h-[300px] w-full overflow-hidden"
            />
            <p v-else class="flex h-52 items-center justify-center text-sm text-slate-400">
              {{ t('detail.noData') }}
            </p>
          </ClientOnly>
        </article>
      </div>
      <p v-else class="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
        {{ t('detail.loadError') }}
      </p>
    </section>
  </main>
</template>
