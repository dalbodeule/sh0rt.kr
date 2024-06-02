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

const records: Ref<{type: string, name: string, value: string}[]> = ref([])
const recordStatus: Ref<Status> = ref(Status.DEFAULT)

provide('domainInfo', domainInfo)
provide('status', status)

const onSubmit = async() => {
  recordStatus.value = Status.PENDING

  try {
    const result = await $fetch(`${config.public.baseUrl}/api/domain/record/${domain}`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(records.value)
    })
    recordStatus.value = Status.SUCCESS
  } catch(e) {
    recordStatus.value = Status.ERROR
  }
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
  const [p, q] = await Promise.all([
    $fetch(`${config.public.baseUrl}/api/domain/${domain}`, {
      method: 'GET'
    }),
    useRequestFetch()(`${config.public.baseUrl}/api/domain/record/${domain}`, {
      method: 'GET'
    })
  ])
  domainInfo.value = {
    domain: p.domain,
    expires: dayjs(p.expires).format('YYYY-MM-DD'),
  }
  records.value = q
})()
</script>

<template>
  <div>
    <div class="box content">
      <h1>{{domain}}.space-mc.com 관리</h1>
      <DomainField submit-text="수정하기" @submit="onSubmit" :is-new="false" :lock="false"/>
      <div class="notification is-success" v-if="status == Status.SUCCESS">
        <p>{{domainInfo.domain}}.space-mc.com 수정에 성공했습니다.</p>
        <p>만료일: {{ dayjs(domainInfo.expires).format('YYYY-MM-DD')}}</p>
      </div>
      <div class="notification is-warning" v-else-if="status == Status.ERROR">
        <p>수정에 실패했습니다.</p>
      </div>
      <progress class="progress is-primary" v-else-if="status == Status.PENDING" max="100"></progress>
    </div>
    <div class="box content">
      <h1>{{domain}} 레코드 관리</h1>

      <div class="field">
        <label class="label">Records</label>
        <div class="control">
          <div v-for="(record, index) in records" :key="index" class="box">
            <div class="field">
              <label class="label">레코드 타입</label>
              <div class="control">
                <input class="input" type="text" v-model="record.type" placeholder="Enter record type">
              </div>
            </div>

            <div class="field">
              <label class="label">레코드 이름</label>
              <div class="control">
                <input class="input" type="text" v-model="record.name" placeholder="Enter record name">
              </div>
            </div>

            <div class="field">
              <label class="label">레코드 값</label>
              <div class="control">
                <input class="input" type="text" v-model="record.value" placeholder="Enter record value">
              </div>
            </div>

            <button class="button is-danger" @click="records.splice(index, 1)">Remove</button>
          </div>
        </div>
      </div>
      <button class="button is-link" @click="records.push({type: '', name: '', value: ''})">Add Record</button>
      <button class="button is-primary" @click="onSubmit">Submit</button>
    </div>
    <div class="notification is-success" v-if="recordStatus == Status.SUCCESS">
      <p>레코드 수정에 성공했습니다.</p>
    </div>
    <div class="notification is-warning" v-else-if="recordStatus == Status.ERROR">
      <p>수정에 실패했습니다.</p>
    </div>
    <progress class="progress is-primary" v-else-if="recordStatus == Status.PENDING" max="100"></progress>
  </div>
</template>

<style scoped>

</style>