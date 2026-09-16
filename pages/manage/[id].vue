<script setup lang="ts">
import { GChart } from 'vue-google-charts'
import type { GoogleChartWrapperChartType } from 'vue-google-charts/dist/types'
import { setLocale } from '@vee-validate/i18n'
import dayjs from 'dayjs'
import { Status } from '~/common/enums'
import type { IUIDPostRequest } from '~/server/routes/api/forward/index.post'
import type { IAnalyticsResponse, IManageResponse } from '~/server/routes/api/manage/[id].get'

const route = useRoute()
const manageId = String(route.params.id)
const config = useRuntimeConfig()
const { loggedIn } = useUserSession()
if (!loggedIn.value) await navigateTo('/')

let managed: IManageResponse
try {
  managed = await useRequestFetch()<IManageResponse>(`/api/manage/${manageId}`)
} catch {
  throw createError({ statusCode: 404, statusMessage: '관리할 단축주소를 찾을 수 없습니다.' })
}

const uid = managed.link.uid
const addrInfo = ref<IUIDPostRequest>({
  uid,
  forward: managed.link.forward,
  expires: dayjs(managed.link.expires).format('YYYY-MM-DD'),
  token: '',
})
const status = ref(Status.DEFAULT)
const errorMessage = ref('')
const analytics = ref<IAnalyticsResponse | null>(managed.analytics)
provide('addrInfo', addrInfo)
provide('status', status)

const onSubmit = async () => {
  status.value = Status.PENDING
  errorMessage.value = ''
  try {
    await $fetch(`/api/manage/${manageId}` as string, { method: 'PATCH', body: addrInfo.value })
    status.value = Status.SUCCESS
  } catch (error: unknown) {
    status.value = Status.ERROR
    errorMessage.value = error instanceof Error ? error.message : '수정하지 못했습니다.'
  }
}

const chartOptions = { chartArea: { width: '82%', height: '72%' }, legend: { position: 'bottom' }, backgroundColor: 'transparent' }
const hasRows = (data?: [string, string | number][]) => Boolean(data && data.length > 1)
const charts: { key: keyof IAnalyticsResponse, title: string, type: GoogleChartWrapperChartType }[] = [
  { key: 'country', title: '국가', type: 'GeoChart' },
  { key: 'browser', title: '브라우저', type: 'PieChart' },
  { key: 'os', title: '운영체제', type: 'PieChart' },
  { key: 'device', title: '기기', type: 'PieChart' },
  { key: 'language', title: '언어', type: 'PieChart' },
  { key: 'requestDomain', title: '접속 도메인', type: 'PieChart' },
  { key: 'requestPath', title: '접속 URI', type: 'PieChart' },
  { key: 'sourceDomain', title: '유입 도메인', type: 'PieChart' },
  { key: 'sourcePath', title: '유입 URI', type: 'PieChart' },
]

useSeoMeta({ title: `sh0rt.kr :: /${uid} 관리`, description: '단축주소와 방문 통계 관리', robots: { all: false } })
setLocale('ko')
</script>

<template>
  <main class="space-y-6 py-4 sm:py-8">
    <header>
      <p class="text-sm font-semibold text-blue-600">LINK MANAGEMENT</p>
      <h1 class="mt-1 break-all text-3xl font-black tracking-tight text-slate-950">/{{ uid }} 관리</h1>
      <a :href="`${config.public.baseUrl}/${uid}`" target="_blank" rel="noopener" class="mt-2 inline-block break-all text-sm text-blue-600 hover:underline">{{ config.public.baseUrl }}/{{ uid }} ↗</a>
    </header>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 class="mb-6 text-xl font-bold">링크 설정</h2>
      <ShorterField submit-text="변경사항 저장" :is-new="false" :lock="false" @submit="onSubmit" />
      <p v-if="status === Status.SUCCESS" class="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">변경사항을 저장했습니다.</p>
      <p v-if="status === Status.ERROR" role="alert" class="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{{ errorMessage }}</p>
    </section>

    <ClientOnly>
      <QRCodeGenerator :value="`${config.public.baseUrl}/${uid}`" />
      <template #fallback><div class="h-80 animate-pulse rounded-2xl bg-slate-100" /></template>
    </ClientOnly>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div class="mb-6">
        <h2 class="text-xl font-bold">방문 통계</h2>
        <p class="mt-1 text-sm text-slate-500">최근 90일, 최대 10,000건을 집계하며 최대 30분간 캐시됩니다. 방문자 IP는 비밀값과 함께 해시 처리됩니다.</p>
      </div>
      <div v-if="analytics" class="grid gap-5 lg:grid-cols-2">
        <article v-for="chart in charts" :key="chart.key" class="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3">
          <h3 class="px-2 pt-2 text-sm font-bold text-slate-700">{{ chart.title }}</h3>
          <ClientOnly>
            <GChart v-if="hasRows(analytics[chart.key])" :type="chart.type" :data="analytics[chart.key]" :settings="{ packages: chart.type === 'GeoChart' ? ['geochart'] : ['corechart'] }" :options="chartOptions" class="h-[300px] w-full overflow-hidden" />
            <p v-else class="flex h-52 items-center justify-center text-sm text-slate-400">아직 데이터가 없습니다.</p>
          </ClientOnly>
        </article>
      </div>
      <p v-else class="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">통계를 불러올 수 없거나 아직 방문 데이터가 없습니다.</p>
    </section>
  </main>
</template>
