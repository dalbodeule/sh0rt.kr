<script setup lang="ts">
import type {Ref} from "vue";
import dayjs from "dayjs";
import {Status} from "~/common/enums";
import type {IDomainPostRequest} from "~/server/routes/api/domain/index.post";
import RecordItem from "~/components/RecordItem.vue";
import {setLocale} from "@vee-validate/i18n";
import getDomain from "~/common/getDomain";

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const { loggedIn, user: _user, session: _session, clear: _clear } = useUserSession()

const fullDomain = route.params.domain as string;
const [domain, tld] = getDomain(fullDomain)

if(!loggedIn.value) {
  router.push('/')
}

const domainInfo: Ref<IDomainPostRequest> = ref({ domain, expires: dayjs().format('YYYY-MM-DD'), tld })
const status: Ref<Status> = ref(Status.DEFAULT)

const records: Ref<{type: string, name: string, value: string}[]> = ref([])
const recordStatus: Ref<Status> = ref(Status.DEFAULT)

provide('domainInfo', domainInfo)
provide('status', status)

const onSubmit = async() => {
  recordStatus.value = Status.PENDING
  try {
    const result = await $fetch(`${config.public.baseUrl}/api/domain/record/${fullDomain}`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(records.value)
    })
    console.log(result)
    recordStatus.value = Status.SUCCESS
    records.value = result
  } catch(e) {
    recordStatus.value = Status.ERROR
  }
}

const removeRecord = (index: number) => {
  records.value.splice(index, 1)
}

const updateRecord = (index: number, value: { type: string, name: string, value: string }) => {
  records.value[index] = value
}

useSeoMeta({
  title: `sh0rt.kr :: manage :: ${fullDomain}`,
  description: `sh0rt.kr :: 강력한 URL 단축기`,
  robots: { all: false },
  ogType: 'website',
  ogSiteName: 'sh0rt.kr',
  ogImage: '/favicon.png',
})

;(async() => {
  const [p, q] = await Promise.all([
    $fetch(`${config.public.baseUrl}/api/domain/${fullDomain}`, {
      method: 'GET'
    }),
    useRequestFetch()(`${config.public.baseUrl}/api/domain/record/${fullDomain}`, {
      method: 'GET'
    })
  ])
  domainInfo.value = {
    domain: p.domain,
    expires: dayjs(p.expires).format('YYYY-MM-DD'),
    tld: p.tld
  }
  records.value = q
})()

setLocale('ko')
</script>

<template>
  <div>
    <div class="box content">
      <h1>{{ domain }}.{{ tld }} 관리</h1>
      <DomainField submit-text="수정하기" :is-new="false" :lock="false" @submit="onSubmit"/>
      <div v-if="status == Status.SUCCESS" class="notification is-success">
        <p>{{ domainInfo.domain }}.{{ domainInfo.tld }}수정에 성공했습니다.</p>
        <p>만료일: {{ dayjs(domainInfo.expires).format('YYYY-MM-DD')}}</p>
      </div>
      <div v-else-if="status == Status.ERROR" class="notification is-warning">
        <p>수정에 실패했습니다.</p>
      </div>
      <progress v-else-if="status == Status.PENDING" class="progress is-primary" max="100"/>
    </div>
    <div class="box content">
      <h1>{{ domain }}.{{ tld }} 레코드 관리</h1>

      <form @submit.prevent="onSubmit">
        <RecordItem v-for="(record, index) in records" :key="`record-${index}`" :record="record" :index="index" @remove="removeRecord" @update="updateRecord"/>
        <div class="field is-grouped">
          <div class="control">
            <button class="button is-link" type="button" :disabled="records.length < 3" @click="(records.length < 3) ? records.push({type: '', name: '', value: ''}) : ''">레코드 추가</button>
          </div>
          <div class="control">
            <button class="button is-primary" type="submit">제출</button>
          </div>
        </div>
      </form>
    </div>
    <div v-if="recordStatus == Status.SUCCESS" class="notification is-success">
      <p>레코드 수정에 성공했습니다.</p>
    </div>
    <div v-else-if="recordStatus == Status.ERROR" class="notification is-warning">
      <p>수정에 실패했습니다.</p>
    </div>
    <progress v-else-if="recordStatus == Status.PENDING" class="progress is-primary" max="100"/>
  </div>
</template>

<style scoped>

</style>