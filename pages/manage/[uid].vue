<script setup lang="ts">
import type { IAnalyticsResponse } from "~/server/routes/api/analytics/[uid].get";
import {GChart} from "vue-google-charts";
import type {Ref} from "vue";
const route = useRoute()
const config = useRuntimeConfig()

const uid = route.params.uid as string

const event = useRequestEvent()
const cloudflare = event?.context!!.cloudflare!!

const aggregateDataByField = (response: IAnalyticsResponse, field: string, fieldName: string): [string, string|number][] => {
  const dataCount: { [key: string]: number } = {};
  const data: [string, string|number][] = [[fieldName, field]]

  response.data.forEach(item => {
    const fieldValue = (item as any as {[key: string]: number})[field] ;
    if (dataCount[fieldValue]) {
      dataCount[fieldValue]++;
    } else {
      dataCount[fieldValue] = 1;
    }
  });

  // 객체를 배열로 변환하여 반환합니다.
  const p: [string, string|number][] = Object.entries(dataCount).map(([key, value]) => [key, value]) as [string, string|number][]
  return data.concat(p);
}

const data: Ref<IAnalyticsResponse | undefined> = ref()
const countryData: Ref<[string, string|number][]> = ref([])
const browserData: Ref<[string, string|number][]> = ref([])
const languageData: Ref<[string, string|number][]> = ref([])
const deviceData: Ref<[string, string|number][]> = ref([])

useSeoMeta({
  title: `sh0rt.kr :: manage :: /${uid}`,
  description: `sh0rt.kr :: 강력한 URL 단축기`,
  robots: { all: false },
  ogType: 'website',
  ogSiteName: 'sh0rt.kr',
  ogImage: '/favicon.png',
})

;(async() => {
  data.value = await useRequestFetch()(`${config.public.baseUrl}/api/analytics/${uid}`, {
    method: 'GET',
    credentials: 'include',
  })

  if(data.value) {
    countryData.value = aggregateDataByField(data.value, 'country', '국가별 접속통계')
    browserData.value = aggregateDataByField(data.value, 'browser', '브라우저별 접속통계')
    languageData.value = aggregateDataByField(data.value, 'language', '언어권별 접속통계')
    deviceData.value = aggregateDataByField(data.value, 'device', '디바이스별 접속통계')
  }
})()
</script>

<template>
  <div class="box content">
    <h1>{{config.public.baseUrl}}/{{uid}} 의 접속통계</h1>
    <h3>지역별 통계</h3>
    <GChart type="GeoChart" :data="countryData" :settings="{ packages: ['geochart']}"/>
    <div class="grid">
      <div class="cell">
        <h3>브라우저별 통계</h3>
        <GChart type="PieChart" :data="browserData" :settings="{ packages: ['corechart']}" :options="{ width: 500 }" />
      </div>
      <div class="cell">
        <h3>언어권별 통계</h3>
        <GChart type="PieChart" :data="languageData" :settings="{ packages: ['corechart']}" :options="{ width: 500 }"/>
      </div>
    </div>
    <div class="grid">
      <div class="cell">
        <h3>디바이스별 통계</h3>
        <GChart type="PieChart" :data="deviceData" :settings="{ packages: ['corechart']}" :options="{ width: 500 }"/>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>