<script setup lang="ts">
import type { IListUrls } from "~/server/routes/api/manage/index.post"
import type { IListDomains } from "~/server/routes/api/domain/list.post"
import type { Ref } from "vue"
import dayjs from "dayjs"
import { Status } from "~/common/enums"
import type {IDDNSKeyPost} from "~/server/routes/api/domain/ddns/index.post";

const _route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const { loggedIn, user: _user, session: _session, clear: _clear } = useUserSession()

if(!loggedIn.value) {
  router.push('/')
}

useSeoMeta({
  title: `sh0rt.kr :: manage`,
  description: `sh0rt.kr :: 강력한 URL 단축기`,
  robots: { all: false },
  ogType: 'website',
  ogSiteName: 'sh0rt.kr',
  ogImage: '/favicon.png',
})

const data: Ref<IListUrls | undefined> = ref()
const domain: Ref<IListDomains | undefined> = ref()
const isDDNSAvailable = ref(false)
const DDNSStatus: Ref<Status> = ref(Status.DEFAULT)
const DDNSPassword: Ref<IDDNSKeyPost> = ref({ password: '', password2: '' })
provide('ddns', DDNSPassword)

const onSubmit = async () => {
  try {
    const result = await useRequestFetch()(`${config.public.baseUrl}/api/domain/ddns`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(DDNSPassword.value)
    })
    if(result) {
      DDNSStatus.value = Status.SUCCESS
    } else {
      DDNSStatus.value = Status.ERROR
    }
  } catch(e) {
    DDNSStatus.value = Status.ERROR
  }
}

;(async() => {
  [data.value, domain.value] = await Promise.all([
    await useRequestFetch()(`${config.public.baseUrl}/api/manage`, {
      method: 'POST',
      credentials: 'include',
    }),
    await useRequestFetch()(`${config.public.baseUrl}/api/domain/list`, {
      method: 'POST',
      credentials: 'include'
    })
  ])
  try {
    const p: { success: boolean } = await useRequestFetch()(`${config.public.baseUrl}/api/domain/ddns`, {
      method: 'GET',
      credentials: 'include'
    })
    if(p.success)
      isDDNSAvailable.value = true
  } catch(e) {
    isDDNSAvailable.value = false
  }
})()
</script>

<template>
  <div class="box content">
    <h1>단축주소 목록</h1>
    <div class="fixed-grid has-1-cols-mobile has-1-cols-tablet has-2-cols-desktop has-2-cols-fullhd">
      <div class="grid">
        <div v-for="url in data" :key="`url-${url.uid}`" class="cell">
          <div class="card">
            <div class="card-header">
              <a class="card-header-title" :href="`${config.public.baseUrl}/${url.uid}`">{{ config.public.baseUrl }}/{{ url.uid }}</a>
            </div>
            <div class="card-content">
              <table class="table is-striped is-fullwidth">
                <tbody>
                  <tr>
                    <td>연결주소</td>
                    <td>{{ url.forward }}</td>
                  </tr>
                  <tr>
                    <td>생성일</td>
                    <td>{{ dayjs(url.created_at).format('YYYY-MM-DD') }}</td>
                  </tr>
                  <tr>
                    <td>수정일</td>
                    <td>{{ dayjs(url.updated_at).format('YYYY-MM-DD') }}</td>
                  </tr>
                  <tr>
                    <td>만료</td>
                    <td>{{ dayjs(url.expires).format("YYYY-MM-DD") }}</td>
                  </tr>
                </tbody>
              </table>
              <NuxtLink v-if="new Date(url.expires).getTime() > Date.now()" :to="`/manage/${url.uid}`" class="button is-primary">관리하기</NuxtLink>
              <a v-else href="#" class="button is-primary is-disabled">이미 만료되었습니다.</a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div style="margin-top: 30px;"/>
    <h1>도메인 목록</h1>
    <div class="fixed-grid has-1-cols-mobile has-1-cols-tablet has-2-cols-desktop has-2-cols-fullhd">
      <div class="grid">
        <div v-for="sub in domain" :key="`url-${sub.domain}`" class="cell">
          <div class="card">
            <div class="card-header">
              <p class="card-header-title">{{ sub.domain }}.{{ sub.tld }}</p>
            </div>
            <div class="card-content">
              <table class="table is-striped is-fullwidth">
                <tbody>
                  <tr>
                    <td>생성일</td>
                    <td>{{ dayjs(sub.created_at).format('YYYY-MM-DD') }}</td>
                  </tr>
                  <tr>
                    <td>수정일</td>
                    <td>{{ dayjs(sub.updated_at).format('YYYY-MM-DD') }}</td>
                  </tr>
                  <tr>
                    <td>만료</td>
                    <td>{{ dayjs(sub.expires).format("YYYY-MM-DD") }}</td>
                  </tr>
                </tbody>
              </table>
              <NuxtLink v-if="new Date(sub.expires).getTime() > Date.now()" :to="`/manage/domain/${sub.domain}.${sub.tld}`" class="button is-primary">관리하기</NuxtLink>
              <button v-else type="button" class="button is-primary" disabled>이미 만료되었습니다.</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div style="margin-top: 30px;"/>
    <h1>DDNS 설정</h1>
    <div class="card">
      <div class="card-header">
        <p class="card-header-title">DDNS 설정</p>
      </div>
      <div class="card-content">
        <div v-if="isDDNSAvailable" class="notification is-success">
          <p>DDNS 비밀번호가 설정되어 있습니다.</p>
        </div>
        <div v-else class="notification is-warning">
          <p>DDNS 비밀번호를 설정해주세요. 설정하지 않으면 DDNS를 사용할 수 없습니다.</p>
        </div>
        <div style="margin-top: 30px;" />
        <DDNSKeyField :lock="DDNSStatus == Status.SUCCESS" @submit="onSubmit"/>
        <div style="margin-top: 30px;" />
        <div v-if="DDNSStatus == Status.SUCCESS" class="notification is-success">
          <p>DDNS 비밀번호 설정에 성공했습니다.</p>
        </div>
        <div v-else-if="DDNSStatus == Status.ERROR" class="notification is-warning">
          <p>DDNS 비밀번호 설정에 실패했습니다.</p>
        </div>
        <progress v-else-if="DDNSStatus == Status.PENDING" class="progress is-primary" max="100"/>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>