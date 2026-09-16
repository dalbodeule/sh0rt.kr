<script setup lang="ts">
import dayjs from 'dayjs'

interface LinkItem { id: number, uid: string, manage_id: string, forward: string, created_at: string, updated_at: string, expires: string }
interface ListResponse { items: LinkItem[], page: number, pageSize: number, total: number, stats: { total: number, active: number, expired: number } }
const config = useRuntimeConfig()
const { loggedIn } = useUserSession()
if (!loggedIn.value) await navigateTo('/')
useSeoMeta({ title: 'sh0rt.kr :: 내 링크', robots: { all: false } })

const page = ref(1)
const q = ref('')
const status = ref('all')
const loading = ref(false)
const errorMessage = ref('')
const data = ref<ListResponse>({ items: [], page: 1, pageSize: 12, total: 0, stats: { total: 0, active: 0, expired: 0 } })
const totalPages = computed(() => Math.max(1, Math.ceil(data.value.total / data.value.pageSize)))
const isExpired = (value: string) => new Date(value).getTime() <= Date.now()
const load = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    data.value = await useRequestFetch()<ListResponse>('/api/manage/list', { query: { page: page.value, pageSize: 12, q: q.value || undefined, status: status.value === 'all' ? undefined : status.value } })
  } catch { errorMessage.value = '목록을 불러오지 못했습니다.' } finally { loading.value = false }
}
const search = () => { page.value = 1; void load() }
const changePage = (next: number) => { page.value = next; void load() }
await load()
</script>

<template>
  <main class="space-y-7 py-4">
    <header><p class="text-sm font-semibold text-blue-600">MY LINKS</p><h1 class="mt-1 text-3xl font-bold text-slate-950">내 단축주소</h1></header>
    <section class="grid gap-4 sm:grid-cols-3"><article v-for="item in [['전체', data.stats.total], ['활성', data.stats.active], ['만료', data.stats.expired]]" :key="String(item[0])" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-sm text-slate-500">{{ item[0] }}</p><p class="mt-1 text-3xl font-bold text-slate-950">{{ item[1] }}</p></article></section>
    <form class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row" @submit.prevent="search"><input v-model="q" placeholder="단축주소 또는 연결주소 검색" class="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5"><select v-model="status" class="rounded-xl border border-slate-300 px-4 py-2.5"><option value="all">전체 상태</option><option value="active">활성</option><option value="expired">만료</option></select><button class="rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white">검색</button></form>
    <p v-if="errorMessage" class="rounded-xl bg-red-50 p-4 text-red-700">{{ errorMessage }}</p><p v-else-if="loading" class="rounded-xl bg-slate-100 p-6 text-slate-500">불러오는 중…</p><p v-else-if="!data.items.length" class="rounded-xl bg-slate-100 p-6 text-slate-600">조건에 맞는 단축주소가 없습니다.</p>
    <div v-else class="grid gap-5 md:grid-cols-2"><article v-for="url in data.items" :key="url.manage_id" class="rounded-2xl border p-5 shadow-sm" :class="isExpired(url.expires) ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'"><div class="flex items-start justify-between gap-3"><a class="break-all font-semibold text-blue-600 hover:underline" :href="`${config.public.baseUrl}/${url.uid}`">{{ config.public.baseUrl }}/{{ url.uid }}</a><span v-if="isExpired(url.expires)" class="shrink-0 rounded-full bg-amber-200 px-2.5 py-1 text-xs font-bold text-amber-900">만료</span></div><dl class="mt-4 space-y-2 text-sm text-slate-600"><div class="flex gap-3"><dt class="w-16 shrink-0 font-medium text-slate-900">연결주소</dt><dd class="break-all">{{ url.forward }}</dd></div><div class="flex gap-3"><dt class="w-16 shrink-0 font-medium text-slate-900">생성일</dt><dd>{{ dayjs(url.created_at).format('YYYY-MM-DD') }}</dd></div><div class="flex gap-3"><dt class="w-16 shrink-0 font-medium text-slate-900">만료일</dt><dd>{{ dayjs(url.expires).format('YYYY-MM-DD') }}</dd></div></dl><NuxtLink v-if="!isExpired(url.expires)" :to="`/manage/${url.manage_id}`" class="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">관리하기</NuxtLink></article></div>
    <nav v-if="data.total" class="flex items-center justify-center gap-3"><button :disabled="page <= 1" class="rounded-lg border px-4 py-2 disabled:opacity-40" @click="changePage(page - 1)">이전</button><span class="text-sm text-slate-600">{{ page }} / {{ totalPages }}</span><button :disabled="page >= totalPages" class="rounded-lg border px-4 py-2 disabled:opacity-40" @click="changePage(page + 1)">다음</button></nav>
  </main>
</template>
