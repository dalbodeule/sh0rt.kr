<script setup lang="ts">
import type { IListUrls } from "~/server/routes/api/manage/index.post";
import type {Ref} from "vue";
import dayjs from "dayjs";

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const { loggedIn, user, session, clear } = useUserSession()

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

;(async() => {
  data.value = await useRequestFetch()(`${config.public.baseUrl}/api/manage`, {
    method: 'GET',
    credentials: 'include',
  })
})()
</script>

<template>
  <div class="box">
    <div class="fixed-grid has-1-cols-mobile has-1-cols-tablet has-2-cols-desktop has-2-cols-fullhd">
      <div class="grid">
        <div class="cell" v-for="url in data" :key="`url-${url.uid}`">
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
              <NuxtLink :to="`/manage/${url.uid}`" class="button is-primary" v-if="new Date(url.expires).getTime() > Date.now()">관리하기</NuxtLink>
              <a href="#" class="button is-primary is-disabled" v-else>이미 만료되었습니다.</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>