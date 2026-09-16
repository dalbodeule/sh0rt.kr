<script setup lang="ts">
import dayjs from 'dayjs';
import { UserRole } from '~/common/userRole';
interface Report {
  id: number;
  uid: string | null;
  forward: string | null;
  reporter_email: string | null;
  reason: string;
  details: string;
  source: string;
  sender: string | null;
  subject: string | null;
  body_text: string | null;
  status: string;
  created_at: string;
}
interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
definePageMeta({ middleware: 'admin' });
useSeoMeta({ title: 'sh0rt.kr :: 신고 관리', robots: { all: false } });
const data = ref<Paged<Report>>({ items: [], page: 1, pageSize: 20, total: 0 });
const selected = ref<Report | null>(null);
const errorMessage = ref('');
const filters = reactive({ q: '', status: 'open', source: '' });
const pages = computed(() => Math.max(1, Math.ceil(data.value.total / data.value.pageSize)));
const queryValues = (value: Record<string, string>) =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item));
const load = async () => {
  try {
    data.value = await useRequestFetch()<Paged<Report>>('/api/admin/reports', {
      query: { page: data.value.page, ...queryValues(filters) },
    });
  } catch {
    errorMessage.value = '신고 목록을 불러오지 못했습니다.';
  }
};
const search = () => {
  data.value.page = 1;
  void load();
};
const update = async (report: Report, status: string) => {
  await $fetch(`/api/admin/report/${report.id}`, { method: 'PATCH', body: { status } });
  await load();
};
const updateSelected = async (status: string) => {
  if (!selected.value) return;
  await update(selected.value, status);
  selected.value = null;
};

const { loggedIn, user, fetch: fetchUserSession } = useUserSession();
await fetchUserSession();

if (
  !loggedIn ||
  !(user.value?.role === UserRole.MODERATOR || user.value?.role === UserRole.ADMIN)
) {
  navigateTo('/');
}
await load();
</script>
<template>
  <main class="space-y-7 py-4">
    <header>
      <p class="text-sm font-semibold text-blue-600">ADMIN CONSOLE / REPORT</p>
      <h1 class="mt-1 text-3xl font-bold text-slate-950">신고 관리</h1>
    </header>
    <AdminStats /><AdminNav />
    <p v-if="errorMessage" class="rounded-xl bg-red-50 p-4 text-red-700">{{ errorMessage }}</p>
    <form
      class="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-5"
      @submit.prevent="search"
    >
      <input
        v-model="filters.q"
        placeholder="UID, 발신자, 제목, 내용"
        class="rounded-lg border px-3 py-2 md:col-span-2"
      /><select v-model="filters.status" class="rounded-lg border px-3 py-2">
        <option value="">모든 상태</option>
        <option value="open">접수</option>
        <option value="reviewing">검토 중</option>
        <option value="resolved">처리 완료</option>
        <option value="dismissed">기각</option></select
      ><select v-model="filters.source" class="rounded-lg border px-3 py-2">
        <option value="">모든 경로</option>
        <option value="web">웹</option>
        <option value="email">이메일</option></select
      ><button class="rounded-lg bg-slate-900 px-4 text-white">검색</button>
    </form>
    <div class="space-y-3">
      <article
        v-for="report in data.items"
        :key="report.id"
        class="cursor-pointer rounded-2xl border bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
        @click="selected = report"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="font-bold">
              #{{ report.id }} · {{ report.uid ? `/${report.uid}` : '링크 미확인' }}
              <span class="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs">{{
                report.source
              }}</span>
            </p>
            <p class="mt-1 text-xs text-slate-500">
              {{ dayjs(report.created_at).format('YYYY-MM-DD HH:mm') }} ·
              {{ report.sender || report.reporter_email || '익명' }} · {{ report.reason }}
            </p>
          </div>
          <select
            :value="report.status"
            class="rounded-lg border px-3 py-2 text-sm"
            @click.stop
            @change="update(report, ($event.target as HTMLSelectElement).value)"
          >
            <option value="open">접수</option>
            <option value="reviewing">검토 중</option>
            <option value="resolved">처리 완료</option>
            <option value="dismissed">기각</option>
          </select>
        </div>
        <p v-if="report.subject" class="mt-4 font-semibold">{{ report.subject }}</p>
        <pre
          class="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm"
          >{{ report.body_text || report.details || '상세 내용 없음' }}</pre>
      </article>
      <p v-if="!data.items.length" class="rounded-xl bg-slate-100 p-6 text-slate-500">
        신고가 없습니다.
      </p>
    </div>
    <PaginationNav
      :page="data.page"
      :pages="pages"
      @change="
        (next) => {
          data.page = next;
          void load();
        }
      "
    />
    <div
      v-if="selected"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      @click.self="selected = null"
    >
      <section
        class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm font-semibold text-blue-600">REPORT #{{ selected.id }}</p>
            <h2 class="mt-1 text-xl font-bold">
              {{ selected.uid ? `/${selected.uid}` : '링크 미확인' }}
            </h2>
          </div>
          <button class="rounded-lg border px-3 py-1" @click="selected = null">닫기</button>
        </div>
        <dl class="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-slate-500">신고 유형</dt>
            <dd class="font-semibold">{{ selected.reason }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">접수 경로</dt>
            <dd class="font-semibold">{{ selected.source }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">신고자</dt>
            <dd class="break-all font-semibold">
              {{ selected.sender || selected.reporter_email || '익명' }}
            </dd>
          </div>
          <div>
            <dt class="text-slate-500">대상 주소</dt>
            <dd class="break-all font-semibold">{{ selected.forward || '확인되지 않음' }}</dd>
          </div>
        </dl>
        <p v-if="selected.subject" class="mt-5 font-semibold">{{ selected.subject }}</p>
        <pre
          class="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border p-4 text-sm"
          >{{ selected.body_text || selected.details || '상세 내용 없음' }}</pre>
        <div class="mt-6 flex justify-end gap-2">
          <button
            class="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 font-semibold text-amber-900"
            @click="updateSelected('dismissed')"
          >
            기각</button
          ><button
            class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white"
            @click="updateSelected('resolved')"
          >
            처리 완료
          </button>
        </div>
      </section>
    </div>
  </main>
</template>
