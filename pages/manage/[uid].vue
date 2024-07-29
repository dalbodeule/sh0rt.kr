<script setup lang="ts">
import type { IAnalyticsResponse } from "~/server/routes/api/manage/[uid].get";
import {GChart} from "vue-google-charts";
import type {Ref} from "vue";
import type {IUIDPostRequest} from "~/server/routes/api/forward/index.post";
import dayjs from "dayjs";
import {Status} from "~/common/enums";
import {setLocale} from "@vee-validate/i18n";

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const uid = route.params.uid as string
const { loggedIn, user: _user, session: _session, clear:_clear } = useUserSession()

if(!loggedIn.value) {
  router.push('/')
}

const addrInfo: Ref<IUIDPostRequest> = ref({ uid: '', forward: '', expires: dayjs().format('YYYY-MM-DD'), token: "" })
const status: Ref<Status> = ref(Status.DEFAULT)

provide('addrInfo', addrInfo)
provide('status', status)

const analytics: Ref<IAnalyticsResponse | undefined> = ref()
const countryData: Ref<[string, string|number][]> = ref([])
const browserData: Ref<[string, string|number][]> = ref([])
const languageData: Ref<[string, string|number][]> = ref([])
const deviceData: Ref<[string, string|number][]> = ref([])

const onSubmit = async() => {
  status.value = Status.PENDING
  try {
    const result = await $fetch(`${config.public.baseUrl}/api/forward/${uid}`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(addrInfo.value)
    })
    console.log(result)
    status.value = Status.SUCCESS
  } catch(e) {
    status.value = Status.ERROR
  }
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
  try {
    analytics.value = await useRequestFetch()(`${config.public.baseUrl}/api/manage/${uid}`, {
      method: 'GET',
      credentials: 'include',
    })
  } catch { console.log("No analytics") }
  const p = await $fetch(`${config.public.baseUrl}/api/forward/${uid}`, {
    method: 'GET'
  })
  addrInfo.value = {
    token: addrInfo.value.token ?? "",
    uid: p.uid,
    forward: p.forward,
    expires: dayjs(p.expires).format('YYYY-MM-DD')
  }

  if(analytics.value) {
    countryData.value = analytics.value.country
    browserData.value = analytics.value.browser
    languageData.value = analytics.value.language
    deviceData.value = analytics.value.device
  }
})()

setLocale('ko')
</script>

<template>
  <div>
    <div class="box content">
      <h1>{{config.public.baseUrl}}/{{uid}} 관리</h1>
      <ShorterField submit-text="수정하기" :is-new="false" :lock="false" @submit="onSubmit"/>
      <div v-if="status == Status.SUCCESS" class="notification is-success">
      <p><a :href="`https://sh0rt.kr/${addrInfo.uid}`">https://sh0rt.kr/{{addrInfo.uid}}</a> 수정에 성공했습니다.</p>
      <p>만료일: {{ dayjs(addrInfo.expires).format('YYYY-MM-DD')}}</p>
    </div>
    <div v-else-if="status == Status.ERROR" class="notification is-warning">
      <p>수정에 실패했습니다.</p>
    </div>
    <progress v-else-if="status == Status.PENDING" class="progress is-primary" max="100"/>
    </div>
    <div class="box content">
      <h1>{{config.public.baseUrl}}/{{uid}} 의 접속통계</h1>
      <h3>지역별 통계</h3>
      <GChart type="GeoChart" :data="analytics?.country" :settings="{ packages: ['geochart']}"/>
      <div class="fixed-grid has-1-cols-mobile has-1-cols-tablet has-2-cols-desktop has-2-cols-fullhd">
        <div class="grid">
          <div class="cell">
            <h3>브라우저별 통계</h3>
            <GChart type="PieChart" :data="analytics?.browser" :settings="{ packages: ['corechart']}" :options="{ width: 500 }" />
          </div>
          <div class="cell">
            <h3>언어권별 통계</h3>
            <GChart type="PieChart" :data="analytics?.language" :settings="{ packages: ['corechart']}" :options="{ width: 500 }"/>
          </div>
          <div class="cell">
            <h3>디바이스별 통계</h3>
            <GChart type="PieChart" :data="analytics?.device" :settings="{ packages: ['corechart']}" :options="{ width: 500 }"/>
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