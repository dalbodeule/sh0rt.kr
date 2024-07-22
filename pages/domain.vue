<script setup lang="ts">
import {setLocale} from '@vee-validate/i18n'

import {Status} from "~/common/enums"
import dayjs from "dayjs"
import getDate from "~/common/getDate"
import type {Ref} from "vue"
import type {IDomainPostRequest} from "~/server/routes/api/domain/index.post"
import type {IDomainLimits} from "~/server/utils/getLimits"

const router = useRouter()
const { loggedIn, user: _user, session: _session, clear: _clear } = useUserSession()
const config = useRuntimeConfig()

if(!loggedIn.value) {
  router.push('/')
}

const domainInfo: Ref<IDomainPostRequest> = ref({domain: '', expires: dayjs(getDate()).format('YYYY-MM-DD'), tld: 'sh0rt.store', token: '' })
const status: Ref<Status> = ref(Status.DEFAULT)
const domainLimit: Ref<IDomainLimits> = ref({})

provide('domainInfo', domainInfo)
provide('status', status)

const onSubmit = async () => {
  console.log("submitted")
  console.log(domainInfo.value)
  status.value = Status.PENDING

  try {
    const result = await $fetch(`${config.public.baseUrl}/api/domain`, {
      method: "POST",
      body: JSON.stringify(domainInfo.value)
    })

    if(result) {
      status.value = Status.SUCCESS
    } else {
      status.value = Status.ERROR
    }
  } catch(e) {
    status.value = Status.ERROR
  }
}

const getStatus = (available: number): string => {
  let status = 'is-success'
    if (available < 250) {
      status = 'is-black'
    } else if (available < 500) {
      status = 'is-danger'
    } else if (available < 750) {
      status = 'is-warning'
    }

    return status
}

useSeoMeta({
  title: `sh0rt.kr :: 서브도메인 생성`,
  description: `sh0rt.kr :: 강력한 URL 단축기`,
  robots: { all: false },
  ogType: 'website',
  ogSiteName: 'sh0rt.kr',
  ogImage: '/favicon.png',
})

setLocale('ko')

;(async() => {
  domainLimit.value = await useRequestFetch()(`${config.public.baseUrl}/api/domain/limit`, {
    method: "GET"
  })
})()
</script>

<template>
  <div class="content">
    <DomainField submit-text="만들기" :is-new="true" :lock="status == Status.SUCCESS" @submit="onSubmit" />
    <div style="margin-top: 30px;" />
    <div v-if="status == Status.SUCCESS" class="notification is-success">
      <p>{{ domainInfo.domain }}.{{ domainInfo.tld }} 생성에 성공했습니다.</p>
      <p>만료일: {{ dayjs(domainInfo.expires).format('YYYY-MM-DD')}}</p>
    </div>
    <div v-else-if="status == Status.ERROR" class="notification is-warning">
      <p>생성에 실패했습니다.</p>
    </div>
    <progress v-else-if="status == Status.PENDING" class="progress is-primary" max="100"/>

    <h1>도메인별 가용 레코드 개수</h1>
    <table class="table is-striped is-fullwidth">
      <thead>
        <tr>
          <th>도메인</th>
          <th>남은 레코드 수</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(record, domain) in domainLimit" :key="domain">
          <td>{{ domain }}</td>
          <td :class="getStatus(record)">{{ record }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>

</style>