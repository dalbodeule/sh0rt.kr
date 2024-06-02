<script setup lang="ts">
import type { IAnalyticsResponse } from "~/server/routes/api/manage/[uid].get";
import {GChart} from "vue-google-charts";
import type {Ref} from "vue";
import dayjs from "dayjs";
import {Status} from "~/common/enums";
import type {IDomainPostRequest} from "~/server/routes/api/domain/index.post";

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const domain = route.params.domain as string
const { loggedIn, user, session, clear } = useUserSession()

if(!loggedIn.value) {
  router.push('/')
}

const domainInfo: Ref<IDomainPostRequest> = ref({ domain: '', expires: dayjs().format('YYYY-MM-DD') })
const status: Ref<Status> = ref(Status.DEFAULT)

provide('domainInfo', domainInfo)
provide('status', status)

const onSubmit = async() => {

}

useSeoMeta({
  title: `sh0rt.kr :: manage :: ${domain}.space-mc.com`,
  description: `sh0rt.kr :: 강력한 URL 단축기`,
  robots: { all: false },
  ogType: 'website',
  ogSiteName: 'sh0rt.kr',
  ogImage: '/favicon.png',
})

;(async() => {
  const p = await $fetch(`${config.public.baseUrl}/api/domain/${domain}`, {
    method: 'GET'
  })
  domainInfo.value = {
    domain: p.domain,
    expires: dayjs(p.expires).format('YYYY-MM-DD'),
  }
})()
</script>

<template>
  <div>
    <div class="box content">
      <h1>{{domain}}.space-mc.com 관리</h1>
      <DomainField submit-text="수정하기" @submit="onSubmit" :is-new="false" :lock="false"/>
    </div>
    <div class="box content">
      <h1>{{domain}} 레코드 관리</h1>

    </div>
  </div>
</template>

<style scoped>

</style>