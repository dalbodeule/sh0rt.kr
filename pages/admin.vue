<script setup lang="ts">
import dayjs from 'dayjs'
import { UserRole } from '~/common/userRole'

interface AdminUser { id: number, email: string, name: string, vendor: string, profile: string, created_at: string, login_limit: string | null, role: number, urlCount: number }
interface AdminUrl { id: number, uid: string, forward: string, created_at: string, expires: string, ownerId: number, ownerName: string, ownerEmail: string, reportCount: number }
interface Report { id: number, uid: string | null, forward: string | null, reporter_email: string | null, reason: string, details: string, source: string, sender: string | null, subject: string | null, body_text: string | null, status: string, created_at: string }
interface Paged<T> { items: T[], page: number, pageSize: number, total: number }
interface Stats { users: number, urls: number, activeUrls: number, expiredUrls: number, reports: number, openReports: number }
const { user } = useUserSession()
if (!user.value || user.value.role < UserRole.MODERATOR) await navigateTo('/')
useSeoMeta({ title: 'sh0rt.kr :: 관리자', robots: { all: false } })

const tab = ref<'users' | 'urls' | 'reports'>('users')
const loading = ref(false)
const errorMessage = ref('')
const stats = ref<Stats>({ users: 0, urls: 0, activeUrls: 0, expiredUrls: 0, reports: 0, openReports: 0 })
const usersData = ref<Paged<AdminUser>>({ items: [], page: 1, pageSize: 20, total: 0 })
const urlsData = ref<Paged<AdminUrl>>({ items: [], page: 1, pageSize: 20, total: 0 })
const reportsData = ref<Paged<Report>>({ items: [], page: 1, pageSize: 20, total: 0 })
const userFilters = reactive({ q: '', vendor: '', status: '', joinedFrom: '', joinedTo: '' })
const urlFilters = reactive({ q: '', ownerId: '', ownerQuery: '', status: '', spam: '' })
const reportFilters = reactive({ q: '', status: 'open', source: '' })
const suspensionTarget = ref<AdminUser | null>(null)
const suspensionType = ref('7d')
const suspensionDate = ref('')
const pageCount = (data: Paged<unknown>) => Math.max(1, Math.ceil(data.total / data.pageSize))
const isSuspended = (member: AdminUser) => !!member.login_limit && new Date(member.login_limit).getTime() > Date.now()
const isPermanent = (member: AdminUser) => !!member.login_limit && new Date(member.login_limit).getFullYear() >= 9999
const queryValues = (filters: Record<string, string>) => Object.fromEntries(Object.entries(filters).filter(([, value]) => value))

const loadStats = async () => { stats.value = (await useRequestFetch()<{ stats: Stats }>('/api/admin/overview')).stats }
const loadUsers = async () => { usersData.value = await useRequestFetch()<Paged<AdminUser>>('/api/admin/users', { query: { page: usersData.value.page, ...queryValues(userFilters) } }) }
const loadUrls = async () => { urlsData.value = await useRequestFetch()<Paged<AdminUrl>>('/api/admin/urls', { query: { page: urlsData.value.page, ...queryValues(urlFilters) } }) }
const loadReports = async () => { reportsData.value = await useRequestFetch()<Paged<Report>>('/api/admin/reports', { query: { page: reportsData.value.page, ...queryValues(reportFilters) } }) }
const loadTab = async () => {
  loading.value = true; errorMessage.value = ''
  try { if (tab.value === 'users') await loadUsers(); else if (tab.value === 'urls') await loadUrls(); else await loadReports() } catch { errorMessage.value = '관리자 데이터를 불러오지 못했습니다.' } finally { loading.value = false }
}
const search = () => { if (tab.value === 'users') usersData.value.page = 1; else if (tab.value === 'urls') urlsData.value.page = 1; else reportsData.value.page = 1; void loadTab() }
const changePage = (next: number) => { if (tab.value === 'users') usersData.value.page = next; else if (tab.value === 'urls') urlsData.value.page = next; else reportsData.value.page = next; void loadTab() }
const chooseTab = (next: typeof tab.value) => { tab.value = next; void loadTab() }
const updateUser = async (target: AdminUser, changes: { role?: number, suspendedUntil?: string | null, permanent?: boolean }) => { try { await $fetch(`/api/admin/user/${target.id}`, { method: 'PATCH', body: changes }); await Promise.all([loadUsers(), loadStats()]) } catch { errorMessage.value = '사용자 변경에 실패했습니다.' } }
const applySuspension = async () => {
  if (!suspensionTarget.value) return
  let suspendedUntil: string | null | undefined
  let permanent = false
  if (suspensionType.value === 'release') suspendedUntil = null
  else if (suspensionType.value === 'permanent') permanent = true
  else if (suspensionType.value === 'custom') suspendedUntil = new Date(`${suspensionDate.value}T23:59:59`).toISOString()
  else suspendedUntil = new Date(Date.now() + Number(suspensionType.value.replace('d', '')) * 86400000).toISOString()
  await updateUser(suspensionTarget.value, { suspendedUntil, permanent }); suspensionTarget.value = null
}
const filterOwner = (member: AdminUser) => { urlFilters.ownerId = String(member.id); urlFilters.ownerQuery = ''; urlsData.value.page = 1; tab.value = 'urls'; void loadTab() }
const deleteUrl = async (target: AdminUrl) => { if (!window.confirm(`/${target.uid} 단축주소를 삭제할까요?`)) return; await $fetch(`/api/admin/url/${target.id}`, { method: 'DELETE' }); await Promise.all([loadUrls(), loadStats()]) }
const updateReport = async (target: Report, status: string) => { await $fetch(`/api/admin/report/${target.id}`, { method: 'PATCH', body: { status } }); await Promise.all([loadReports(), loadStats()]) }
await Promise.all([loadStats(), loadUsers()])
</script>

<template>
  <main class="space-y-7 py-4">
    <header><p class="text-sm font-semibold text-blue-600">ADMIN CONSOLE</p><h1 class="mt-1 text-3xl font-bold text-slate-950">서비스 관리</h1><p class="mt-2 text-sm text-slate-500">사용자, 링크, 신고와 서비스 현황을 관리합니다.</p></header>
    <p v-if="errorMessage" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ errorMessage }}</p>
    <section class="grid gap-3 sm:grid-cols-3 lg:grid-cols-6"><article v-for="item in [['사용자', stats.users], ['전체 링크', stats.urls], ['활성 링크', stats.activeUrls], ['만료 링크', stats.expiredUrls], ['전체 신고', stats.reports], ['처리 필요', stats.openReports]]" :key="String(item[0])" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-xs text-slate-500">{{ item[0] }}</p><p class="mt-1 text-2xl font-bold">{{ item[1] }}</p></article></section>
    <div class="flex gap-2 border-b border-slate-200"><button v-for="item in [{ id: 'users', label: '사용자' }, { id: 'urls', label: '단축주소' }, { id: 'reports', label: '신고' }]" :key="item.id" class="border-b-2 px-4 py-3 font-semibold" :class="tab === item.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'" @click="chooseTab(item.id as typeof tab)">{{ item.label }}</button></div>

    <section v-if="tab === 'users'" class="space-y-4">
      <form class="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-6" @submit.prevent="search"><input v-model="userFilters.q" placeholder="이름 또는 이메일" class="rounded-lg border px-3 py-2 md:col-span-2"><select v-model="userFilters.vendor" class="rounded-lg border px-3 py-2"><option value="">모든 OAuth</option><option value="github">GitHub</option><option value="google">Google</option></select><select v-model="userFilters.status" class="rounded-lg border px-3 py-2"><option value="">모든 상태</option><option value="active">정상</option><option value="suspended">정지</option></select><input v-model="userFilters.joinedFrom" type="date" title="가입 시작일" class="rounded-lg border px-3 py-2"><div class="flex gap-2"><input v-model="userFilters.joinedTo" type="date" title="가입 종료일" class="min-w-0 flex-1 rounded-lg border px-3 py-2"><button class="rounded-lg bg-slate-900 px-4 text-white">검색</button></div></form>
      <div class="overflow-x-auto rounded-2xl border bg-white"><table class="min-w-full text-left text-sm"><thead class="bg-slate-50 text-xs text-slate-500"><tr><th class="px-4 py-3">사용자</th><th class="px-4 py-3">가입일</th><th class="px-4 py-3">링크</th><th class="px-4 py-3">권한</th><th class="px-4 py-3">상태</th></tr></thead><tbody class="divide-y"><tr v-for="member in usersData.items" :key="member.id"><td class="px-4 py-3"><div class="flex items-center gap-3"><img :src="member.profile" alt="" class="h-9 w-9 rounded-full"><div><p class="font-semibold">{{ member.name }}</p><p class="text-xs text-slate-500">{{ member.email }} · {{ member.vendor }}</p></div></div></td><td class="px-4 py-3">{{ dayjs(member.created_at).format('YYYY-MM-DD') }}</td><td class="px-4 py-3"><button class="font-semibold text-blue-600" @click="filterOwner(member)">{{ member.urlCount }}개 보기</button></td><td class="px-4 py-3"><select :value="member.role" :disabled="user?.role !== UserRole.ADMIN || member.id === user?.id" class="rounded-lg border px-2 py-1" @change="updateUser(member, { role: Number(($event.target as HTMLSelectElement).value) })"><option :value="UserRole.USER">사용자</option><option :value="UserRole.MODERATOR">운영자</option><option :value="UserRole.ADMIN">관리자</option></select></td><td class="px-4 py-3"><button v-if="user?.role === UserRole.ADMIN && member.id !== user?.id" class="rounded-lg px-3 py-1.5 font-semibold" :class="isSuspended(member) ? 'bg-amber-100 text-amber-900' : 'bg-red-50 text-red-700'" @click="suspensionTarget = member; suspensionType = isSuspended(member) ? 'release' : '7d'">{{ isSuspended(member) ? (isPermanent(member) ? '영구 정지' : `~ ${dayjs(member.login_limit).format('YYYY-MM-DD')}`) : '정지 설정' }}</button><span v-else>—</span></td></tr></tbody></table></div>
      <PaginationNav :page="usersData.page" :pages="pageCount(usersData)" @change="changePage" />
    </section>

    <section v-else-if="tab === 'urls'" class="space-y-4">
      <form class="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-6" @submit.prevent="search"><input v-model="urlFilters.q" placeholder="단축/연결주소" class="rounded-lg border px-3 py-2 md:col-span-2"><input v-model="urlFilters.ownerQuery" placeholder="소유자 이름/이메일" class="rounded-lg border px-3 py-2"><select v-model="urlFilters.status" class="rounded-lg border px-3 py-2"><option value="">모든 상태</option><option value="active">활성</option><option value="expired">만료</option></select><select v-model="urlFilters.spam" class="rounded-lg border px-3 py-2"><option value="">신고 전체</option><option value="reported">신고 의심</option><option value="clean">신고 없음</option></select><button class="rounded-lg bg-slate-900 px-4 text-white">검색</button><p v-if="urlFilters.ownerId" class="md:col-span-6 text-sm text-blue-700">사용자 #{{ urlFilters.ownerId }} 필터 적용 중 <button type="button" class="underline" @click="urlFilters.ownerId = ''; search()">해제</button></p></form>
      <div class="overflow-x-auto rounded-2xl border bg-white"><table class="min-w-full text-left text-sm"><thead class="bg-slate-50 text-xs text-slate-500"><tr><th class="px-4 py-3">주소</th><th class="px-4 py-3">소유자</th><th class="px-4 py-3">대상</th><th class="px-4 py-3">만료</th><th class="px-4 py-3">관리</th></tr></thead><tbody class="divide-y"><tr v-for="link in urlsData.items" :key="link.id" :class="new Date(link.expires).getTime() <= Date.now() ? 'bg-amber-50' : ''"><td class="px-4 py-3"><p class="font-semibold text-blue-600">/{{ link.uid }}</p><span v-if="link.reportCount" class="mt-1 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">신고 {{ link.reportCount }}</span></td><td class="px-4 py-3"><p>{{ link.ownerName }}</p><p class="text-xs text-slate-500">{{ link.ownerEmail }}</p></td><td class="max-w-xs truncate px-4 py-3" :title="link.forward">{{ link.forward }}</td><td class="px-4 py-3">{{ dayjs(link.expires).format('YYYY-MM-DD') }}</td><td class="px-4 py-3"><button class="rounded-lg bg-red-50 px-3 py-1.5 font-semibold text-red-700" @click="deleteUrl(link)">삭제</button></td></tr></tbody></table></div>
      <PaginationNav :page="urlsData.page" :pages="pageCount(urlsData)" @change="changePage" />
    </section>

    <section v-else class="space-y-4">
      <form class="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-5" @submit.prevent="search"><input v-model="reportFilters.q" placeholder="UID, 발신자, 제목, 내용" class="rounded-lg border px-3 py-2 md:col-span-2"><select v-model="reportFilters.status" class="rounded-lg border px-3 py-2"><option value="">모든 상태</option><option value="open">접수</option><option value="reviewing">검토 중</option><option value="resolved">처리 완료</option><option value="dismissed">기각</option></select><select v-model="reportFilters.source" class="rounded-lg border px-3 py-2"><option value="">모든 경로</option><option value="web">웹</option><option value="email">이메일</option></select><button class="rounded-lg bg-slate-900 px-4 text-white">검색</button></form>
      <div class="space-y-3"><article v-for="report in reportsData.items" :key="report.id" class="rounded-2xl border bg-white p-5"><div class="flex flex-wrap items-start justify-between gap-3"><div><p class="font-bold">#{{ report.id }} · {{ report.uid ? `/${report.uid}` : '링크 미확인' }} <span class="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs">{{ report.source }}</span></p><p class="mt-1 text-xs text-slate-500">{{ dayjs(report.created_at).format('YYYY-MM-DD HH:mm') }} · {{ report.sender || report.reporter_email || '익명' }} · {{ report.reason }}</p></div><select :value="report.status" class="rounded-lg border px-3 py-2 text-sm" @change="updateReport(report, ($event.target as HTMLSelectElement).value)"><option value="open">접수</option><option value="reviewing">검토 중</option><option value="resolved">처리 완료</option><option value="dismissed">기각</option></select></div><p v-if="report.subject" class="mt-4 font-semibold">{{ report.subject }}</p><pre class="mt-3 max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{{ report.body_text || report.details || '상세 내용 없음' }}</pre></article><p v-if="!reportsData.items.length" class="rounded-xl bg-slate-100 p-6 text-slate-500">조건에 맞는 신고가 없습니다.</p></div>
      <PaginationNav :page="reportsData.page" :pages="pageCount(reportsData)" @change="changePage" />
    </section>
    <div v-if="loading" class="fixed inset-0 z-40 flex items-center justify-center bg-white/60 text-slate-700 backdrop-blur-sm">불러오는 중…</div>

    <div v-if="suspensionTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" @click.self="suspensionTarget = null"><form class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" @submit.prevent="applySuspension"><h2 class="text-xl font-bold">{{ suspensionTarget.name }} 로그인 정지</h2><p class="mt-2 text-sm text-slate-500">임시 정지 기간이나 영구 정지를 명확히 선택합니다.</p><div class="mt-5 space-y-2"><label v-for="option in [{ v: '1d', l: '1일' }, { v: '7d', l: '7일' }, { v: '30d', l: '30일' }, { v: 'custom', l: '직접 지정' }, { v: 'permanent', l: '영구 정지' }, { v: 'release', l: '정지 해제' }]" :key="option.v" class="flex items-center gap-3 rounded-lg border p-3"><input v-model="suspensionType" type="radio" :value="option.v">{{ option.l }}</label></div><input v-if="suspensionType === 'custom'" v-model="suspensionDate" required type="date" class="mt-3 w-full rounded-lg border px-3 py-2"><div class="mt-6 flex justify-end gap-2"><button type="button" class="rounded-lg border px-4 py-2" @click="suspensionTarget = null">취소</button><button class="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">적용</button></div></form></div>
  </main>
</template>
