<script setup lang="ts">
import dayjs from 'dayjs';
import { UserRole } from '~/common/userRole';
interface AdminUrl {
  id: number;
  uid: string;
  forward: string;
  expires: string;
  ownerName: string;
  ownerEmail: string;
  reportCount: number;
}
interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
definePageMeta({ middleware: 'admin' });
useSeoMeta({ title: 'sh0rt.kr :: 단축주소 관리', robots: { all: false } });
const route = useRoute();
const data = ref<Paged<AdminUrl>>({ items: [], page: 1, pageSize: 20, total: 0 });
const errorMessage = ref('');
const filters = reactive({
  q: '',
  userId: typeof route.query.userId === 'string' ? route.query.userId : '',
  ownerQuery: '',
  status: '',
  spam: '',
});
const pages = computed(() => Math.max(1, Math.ceil(data.value.total / data.value.pageSize)));
const queryValues = (value: Record<string, string>) =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item));
const load = async () => {
  try {
    data.value = await useRequestFetch()<Paged<AdminUrl>>('/api/admin/urls', {
      query: { page: data.value.page, ...queryValues(filters) },
    });
  } catch {
    errorMessage.value = '단축주소 목록을 불러오지 못했습니다.';
  }
};
const search = () => {
  data.value.page = 1;
  void load();
};
const deleteUrl = async (target: AdminUrl) => {
  if (!window.confirm(`/${target.uid} 단축주소를 삭제할까요?`)) return;
  await $fetch(`/api/admin/url/${target.id}`, { method: 'DELETE' });
  await load();
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
      <p class="text-sm font-semibold text-blue-600">ADMIN CONSOLE / URL</p>
      <h1 class="mt-1 text-3xl font-bold text-slate-950">단축주소 관리</h1>
    </header>
    <AdminStats /><AdminNav />
    <p v-if="errorMessage" class="rounded-xl bg-red-50 p-4 text-red-700">{{ errorMessage }}</p>
    <form
      class="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-6"
      @submit.prevent="search"
    >
      <input
        v-model="filters.q"
        placeholder="단축/연결주소"
        class="rounded-lg border px-3 py-2 md:col-span-2"
      /><input
        v-model="filters.ownerQuery"
        placeholder="소유자 이름/이메일"
        class="rounded-lg border px-3 py-2"
      /><select v-model="filters.status" class="rounded-lg border px-3 py-2">
        <option value="">모든 상태</option>
        <option value="active">활성</option>
        <option value="expired">만료</option></select
      ><select v-model="filters.spam" class="rounded-lg border px-3 py-2">
        <option value="">신고 전체</option>
        <option value="reported">신고 의심</option>
        <option value="clean">신고 없음</option></select
      ><button class="rounded-lg bg-slate-900 px-4 text-white">검색</button>
      <p v-if="filters.userId" class="md:col-span-6 text-sm text-blue-700">
        사용자 #{{ filters.userId }} 필터 적용 중
        <button
          type="button"
          class="underline"
          @click="
            filters.userId = '';
            search();
          "
        >
          해제
        </button>
      </p>
    </form>
    <div class="overflow-x-auto rounded-2xl border bg-white">
      <table class="min-w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th class="px-4 py-3">주소</th>
            <th class="px-4 py-3">소유자</th>
            <th class="px-4 py-3">대상</th>
            <th class="px-4 py-3">만료</th>
            <th class="px-4 py-3">관리</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr
            v-for="link in data.items"
            :key="link.id"
            :class="new Date(link.expires).getTime() <= Date.now() ? 'bg-amber-50' : ''"
          >
            <td class="px-4 py-3">
              <p class="font-semibold text-blue-600">/{{ link.uid }}</p>
              <span
                v-if="link.reportCount"
                class="mt-1 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700"
                >신고 {{ link.reportCount }}</span
              >
            </td>
            <td class="px-4 py-3">
              <p>{{ link.ownerName }}</p>
              <p class="text-xs text-slate-500">{{ link.ownerEmail }}</p>
            </td>
            <td class="max-w-xs truncate px-4 py-3" :title="link.forward">{{ link.forward }}</td>
            <td class="px-4 py-3">{{ dayjs(link.expires).format('YYYY-MM-DD') }}</td>
            <td class="px-4 py-3">
              <button
                class="rounded-lg bg-red-50 px-3 py-1.5 font-semibold text-red-700"
                @click="deleteUrl(link)"
              >
                삭제
              </button>
            </td>
          </tr>
        </tbody>
      </table>
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
  </main>
</template>
