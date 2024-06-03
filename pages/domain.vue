<script setup lang="ts">
import { setLocale } from '@vee-validate/i18n'

import { Status } from "~/common/enums"
import dayjs from "dayjs";
import getDate from "~/common/getDate";
import type { Ref } from "vue";
import type {IDomainPostRequest} from "~/server/routes/api/domain/index.post";

const router = useRouter()
const { loggedIn, user: _user, session: _session, clear: _clear } = useUserSession()
const config = useRuntimeConfig()

if(!loggedIn.value) {
  router.push('/')
}

const domainInfo: Ref<IDomainPostRequest> = ref({domain: '', expires: dayjs(getDate()).format('YYYY-MM-DD'), tld: 'space-mc.com' })
const status: Ref<Status> = ref(Status.DEFAULT)

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

useSeoMeta({
  title: `sh0rt.kr :: SRV Domain`,
  description: `sh0rt.kr :: 강력한 URL 단축기`,
  robots: { all: false },
  ogType: 'website',
  ogSiteName: 'sh0rt.kr',
  ogImage: '/favicon.png',
})


setLocale('ko')
</script>

<template>
  <div>
    <DomainField submit-text="만들기" :is-new="true" :lock="status == Status.SUCCESS" @submit="onSubmit" />
    <div style="margin-top: 30px;" />
    <div v-if="status == Status.SUCCESS" class="notification is-success">
      <p>{{domainInfo.domain}}.space-mc.com 생성에 성공했습니다.</p>
      <p>만료일: {{ dayjs(domainInfo.expires).format('YYYY-MM-DD')}}</p>
    </div>
    <div v-else-if="status == Status.ERROR" class="notification is-warning">
      <p>생성에 실패했습니다.</p>
    </div>
    <progress v-else-if="status == Status.PENDING" class="progress is-primary" max="100"/>
  </div>
</template>

<style scoped>

</style>