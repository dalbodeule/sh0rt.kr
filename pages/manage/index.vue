<script setup lang="ts">
import type { IListUrls } from "~/server/routes/api/manage/index.post"
import dayjs from "dayjs"

const router = useRouter()
const config = useRuntimeConfig()
const { loggedIn } = useUserSession()

if (!loggedIn.value) router.push('/')

useSeoMeta({ title: 'sh0rt.kr :: manage', description: 'sh0rt.kr :: 강력한 URL 단축기', robots: { all: false } })

const data = ref<IListUrls | undefined>()
const error = ref(false)

try {
  data.value = await useRequestFetch()(`${config.public.baseUrl}/api/manage`, { method: 'POST', credentials: 'include' })
} catch {
  error.value = true
}
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-8">
    <h1 class="mb-6 text-2xl font-bold text-slate-900">단축주소 목록</h1>
    <p v-if="error" class="rounded-xl bg-red-50 p-4 text-red-700">목록을 불러오지 못했습니다.</p>
    <p v-else-if="!data?.length" class="rounded-xl bg-slate-100 p-6 text-slate-600">아직 만든 단축주소가 없습니다.</p>
    <div v-else class="grid gap-5 md:grid-cols-2">
      <article v-for="url in data" :key="url.uid" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <a class="break-all font-semibold text-blue-600 hover:underline" :href="`${config.public.baseUrl}/${url.uid}`">{{ config.public.baseUrl }}/{{ url.uid }}</a>
        <dl class="mt-4 space-y-2 text-sm text-slate-600">
          <div class="flex gap-3"><dt class="w-16 shrink-0 font-medium text-slate-900">연결주소</dt><dd class="break-all">{{ url.forward }}</dd></div>
          <div class="flex gap-3"><dt class="w-16 shrink-0 font-medium text-slate-900">생성일</dt><dd>{{ dayjs(url.created_at).format('YYYY-MM-DD') }}</dd></div>
          <div class="flex gap-3"><dt class="w-16 shrink-0 font-medium text-slate-900">만료일</dt><dd>{{ dayjs(url.expires).format('YYYY-MM-DD') }}</dd></div>
        </dl>
        <NuxtLink v-if="new Date(url.expires).getTime() > Date.now()" :to="`/manage/${url.uid}`" class="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">관리하기</NuxtLink>
        <span v-else class="mt-5 inline-flex rounded-lg bg-slate-200 px-4 py-2 text-sm text-slate-500">만료됨</span>
      </article>
    </div>
  </main>
</template>
