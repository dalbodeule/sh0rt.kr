<script setup lang="ts">
import type { IAnalyticsResponse } from "~/server/routes/api/manage/[uid].get";
import {GChart} from "vue-google-charts";
import type {Ref} from "vue";
import type {IUIDPostRequest} from "~/server/routes/api/forward/index.post";
import dayjs from "dayjs";
import {Status} from "~/common/enums";

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const uid = route.params.uid as string
const { loggedIn, user, session, clear } = useUserSession()

if(!loggedIn.value) {
  router.push('/')
}

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

const addrInfo: Ref<IUIDPostRequest> = ref({ uid: '', forward: '', expires: dayjs().format('YYYY-MM-DD') })
const status: Ref<Status> = ref(Status.DEFAULT)

provide('addrInfo', addrInfo)
provide('status', status)

const analytics: Ref<IAnalyticsResponse | undefined> = ref()
const countryData: Ref<[string, string|number][]> = ref([])
const browserData: Ref<[string, string|number][]> = ref([])
const languageData: Ref<[string, string|number][]> = ref([])
const deviceData: Ref<[string, string|number][]> = ref([])

const onSubmit = async() => {

}

useSeoMeta({
  title: `sh0rt.kr :: manage :: /${uid}`,
  description: `sh0rt.kr :: 강력한 URL 단축기`,
  robots: { all: false },
  ogType: 'website',
  ogSiteName: 'sh0rt.kr',
  ogImage: '/favicon.png',
})

;(async() => {
  analytics.value = await useRequestFetch()(`${config.public.baseUrl}/api/manage/${uid}`, {
    method: 'GET',
    credentials: 'include',
  })
  const p = await $fetch(`${config.public.baseUrl}/api/forward/${uid}`, {
    method: 'GET'
  })
  addrInfo.value = {
    uid: p.uid,
    forward: p.forward,
    expires: dayjs(p.expires).format('YYYY-MM-DD'),
  }

  if(analytics.value) {
    countryData.value = aggregateDataByField(analytics.value, 'country', '국가별 접속통계')
    browserData.value = aggregateDataByField(analytics.value, 'browser', '브라우저별 접속통계')
    languageData.value = aggregateDataByField(analytics.value, 'language', '언어권별 접속통계')
    deviceData.value = aggregateDataByField(analytics.value, 'device', '디바이스별 접속통계')
  }
})()
</script>

<template>
  <div>
    <div class="box content">
      <h1>{{config.public.baseUrl}}/{{uid}} 관리</h1>
      <ShorterField submit-text="수정하기" @submit="onSubmit" :is-new="false"/>
    </div>
    <div class="box content">
      <h1>{{config.public.baseUrl}}/{{uid}} 의 접속통계</h1>
      <h3>지역별 통계</h3>
      <GChart type="GeoChart" :data="countryData" :settings="{ packages: ['geochart']}"/>
      <div class="fixed-grid has-1-cols-mobile has-1-cols-tablet has-2-cols-desktop has-2-cols-fullhd">
        <div class="grid">
          <div class="cell">
            <h3>브라우저별 통계</h3>
            <GChart type="PieChart" :data="browserData" :settings="{ packages: ['corechart']}" :options="{ width: 500 }" />
          </div>
          <div class="cell">
            <h3>언어권별 통계</h3>
            <GChart type="PieChart" :data="languageData" :settings="{ packages: ['corechart']}" :options="{ width: 500 }"/>
          </div>
          <div class="cell">
            <h3>디바이스별 통계</h3>
            <GChart type="PieChart" :data="deviceData" :settings="{ packages: ['corechart']}" :options="{ width: 500 }"/>
          </div>
        </div>
      </div>
      <p>통계 데이터는 단축주소가 만들어 진 시점부터 최대 3개월간 제공됩니다.</p>
      <p>통계 데이터의 캐싱 시간은 30분 입니다. 캐시 강제삭제 기능은 제공하지 않습니다.</p>
    </div>
  </div>
</template>

<style scoped>

</style>