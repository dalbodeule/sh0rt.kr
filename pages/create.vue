<script setup lang="ts">
import type { Ref } from "vue";
import { setLocale } from '@vee-validate/i18n'

import { Status } from "~/common/enums"
import dayjs from "dayjs";
import type {IUIDPostRequest} from "~/server/routes/api/forward/index.post";
import getDate from "~/common/getDate";

const router = useRouter()
const { loggedIn, user: _user, session: _session, clear: _clear } = useUserSession()
const config = useRuntimeConfig()

if(!loggedIn.value) {
  router.push('/')
}

const addrInfo: Ref<IUIDPostRequest> = ref({ uid: '', forward: '', expires: dayjs(getDate()).format('YYYY-MM-DD') })
const status: Ref<Status> = ref(Status.DEFAULT)

provide('addrInfo', addrInfo)
provide('status', status)

const onSubmit = async () => {
  console.log("submitted")
  status.value = Status.PENDING

  try {
    const result = await $fetch(`${config.public.baseUrl}/api/forward`, {
      method: "POST",
      body: JSON.stringify(addrInfo.value)
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
  title: `sh0rt.kr :: create`,
  description: `sh0rt.kr :: 강력한 URL 단축기`,
  robots: { all: false },
  ogType: 'website',
  ogSiteName: 'sh0rt.kr',
  ogImage: '/favicon.png',
})

setLocale('ko')
</script>

<template>
  <div class="box content">
    <ShorterField submit-text="만들기" :is-new="true" :lock="status == Status.SUCCESS" @submit="onSubmit"/>
    <div style="margin-top: 30px;" />
    <div v-if="status == Status.SUCCESS" class="notification is-success">
      <p><a :href="`https://sh0rt.kr/${addrInfo.uid}`">https://sh0rt.kr/{{addrInfo.uid}}</a> 생성에 성공했습니다.</p>
      <p>만료일: {{ dayjs(addrInfo.expires).format('YYYY-MM-DD')}}</p>
    </div>
    <div v-else-if="status == Status.ERROR" class="notification is-warning">
      <p>생성에 실패했습니다.</p>
    </div>
    <progress v-else-if="status == Status.PENDING" class="progress is-primary" max="100"/>
  </div>
</template>

<style scoped>

</style>