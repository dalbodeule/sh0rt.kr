<script setup lang="ts">
import dayjs from 'dayjs'
import { UserRole } from '~/common/userRole'

interface AdminUser {
  id: number
  email: string
  name: string
  vendor: string
  profile: string
  created_at: string | Date
  login_limit: string | Date | null
  role: number
  urlCount: number
}
interface AdminUrl {
  id: number
  uid: string
  forward: string
  expires: string | Date
  owner: { id: number, name: string, email: string }
}
interface Overview {
  stats: { users: number, urls: number, activeUrls: number }
  users: AdminUser[]
  urls: AdminUrl[]
}

const { user } = useUserSession()
if (!user.value || user.value.role < UserRole.MODERATOR) await navigateTo('/')

useSeoMeta({ title: 'sh0rt.kr :: 관리자', robots: { all: false } })

const overview = ref<Overview>()
const loading = ref(true)
const errorMessage = ref('')
const stats = computed(() => overview.value ? [
  ['사용자', overview.value.stats.users],
  ['전체 단축주소', overview.value.stats.urls],
  ['활성 단축주소', overview.value.stats.activeUrls],
] : [])

const load = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    overview.value = await useRequestFetch()<Overview>('/api/admin/overview')
  } catch {
    errorMessage.value = '관리자 데이터를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

const updateUser = async (target: AdminUser, changes: { role?: number, suspended?: boolean }) => {
  errorMessage.value = ''
  try {
    await $fetch(`/api/admin/user/${target.id}`, { method: 'PATCH', body: changes })
    await load()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : '사용자 변경에 실패했습니다.'
  }
}

const deleteUrl = async (target: AdminUrl) => {
  if (!window.confirm(`/${target.uid} 단축주소를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return
  try {
    await $fetch(`/api/admin/url/${target.id}`, { method: 'DELETE' })
    await load()
  } catch {
    errorMessage.value = '단축주소 삭제에 실패했습니다.'
  }
}

await load()
</script>

<template>
  <main class="space-y-8 py-4">
    <header>
      <p class="text-sm font-semibold text-blue-600">ADMIN CONSOLE</p>
      <h1 class="mt-1 text-3xl font-bold tracking-tight text-slate-950">서비스 관리</h1>
      <p class="mt-2 text-sm text-slate-500">사용자 권한과 단축주소를 한곳에서 관리합니다.</p>
    </header>

    <p v-if="errorMessage" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ errorMessage }}</p>
    <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">불러오는 중…</div>

    <template v-else-if="overview">
      <section class="grid gap-4 sm:grid-cols-3" aria-label="서비스 통계">
        <article v-for="item in stats" :key="String(item[0])" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm text-slate-500">{{ item[0] }}</p>
          <p class="mt-2 text-3xl font-bold text-slate-950">{{ item[1] }}</p>
        </article>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-200 px-5 py-4"><h2 class="text-lg font-bold">사용자</h2></div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th class="px-5 py-3">사용자</th><th class="px-5 py-3">가입일</th><th class="px-5 py-3">링크</th><th class="px-5 py-3">권한</th><th class="px-5 py-3">상태</th></tr></thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="member in overview.users" :key="member.id">
                <td class="px-5 py-4"><div class="flex items-center gap-3"><img :src="member.profile" class="h-9 w-9 rounded-full" alt=""><div><p class="font-semibold text-slate-900">{{ member.name }}</p><p class="text-xs text-slate-500">{{ member.email }} · {{ member.vendor }}</p></div></div></td>
                <td class="px-5 py-4 text-slate-600">{{ dayjs(member.created_at).format('YYYY-MM-DD') }}</td>
                <td class="px-5 py-4 text-slate-600">{{ member.urlCount }}</td>
                <td class="px-5 py-4">
                  <select :value="member.role" class="rounded-lg border border-slate-300 px-2 py-1.5" :disabled="user?.role !== UserRole.ADMIN || member.id === user?.id" @change="updateUser(member, { role: Number(($event.target as HTMLSelectElement).value) })">
                    <option :value="UserRole.USER">사용자</option><option :value="UserRole.MODERATOR">운영자</option><option :value="UserRole.ADMIN">관리자</option>
                  </select>
                </td>
                <td class="px-5 py-4"><button v-if="user?.role === UserRole.ADMIN && member.id !== user?.id" type="button" class="rounded-lg px-3 py-1.5 text-sm font-semibold" :class="member.login_limit && new Date(member.login_limit).getTime() > Date.now() ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'" @click="updateUser(member, { suspended: !(member.login_limit && new Date(member.login_limit).getTime() > Date.now()) })">{{ member.login_limit && new Date(member.login_limit).getTime() > Date.now() ? '정지 해제' : '로그인 정지' }}</button><span v-else class="text-slate-400">—</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-200 px-5 py-4"><h2 class="text-lg font-bold">단축주소</h2></div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th class="px-5 py-3">주소</th><th class="px-5 py-3">소유자</th><th class="px-5 py-3">대상</th><th class="px-5 py-3">만료일</th><th class="px-5 py-3">관리</th></tr></thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="link in overview.urls" :key="link.id"><td class="px-5 py-4 font-semibold text-blue-600">/{{ link.uid }}</td><td class="px-5 py-4"><p>{{ link.owner.name }}</p><p class="text-xs text-slate-500">{{ link.owner.email }}</p></td><td class="max-w-sm truncate px-5 py-4 text-slate-600" :title="link.forward">{{ link.forward }}</td><td class="px-5 py-4 text-slate-600">{{ dayjs(link.expires).format('YYYY-MM-DD') }}</td><td class="px-5 py-4"><button type="button" class="rounded-lg bg-red-50 px-3 py-1.5 font-semibold text-red-700 hover:bg-red-100" @click="deleteUrl(link)">삭제</button></td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </main>
</template>
