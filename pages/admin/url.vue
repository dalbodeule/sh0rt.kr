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
const { t } = useI18n();
const { confirm } = useAppNotice();
useSeoMeta({ title: `sh0rt.kr :: ${t('admin.urlTitle')}`, robots: { all: false } });
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
    errorMessage.value = t('manage.loadError');
  }
};
const search = () => {
  data.value.page = 1;
  void load();
};
const deleteUrl = async (target: AdminUrl) => {
  if (!(await confirm(t('admin.deleteConfirm', { uid: target.uid })))) return;
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
      <h1 class="mt-1 text-3xl font-bold text-slate-950">{{ t('admin.urlTitle') }}</h1>
    </header>
    <AdminStats /><AdminNav />
    <p v-if="errorMessage" class="rounded-xl bg-red-50 p-4 text-red-700">{{ errorMessage }}</p>
    <form
      class="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-6"
      @submit.prevent="search"
    >
      <input
        v-model="filters.q"
        :placeholder="t('admin.urlSearch')"
        class="rounded-lg border px-3 py-2 md:col-span-2"
      /><input
        v-model="filters.ownerQuery"
        :placeholder="t('admin.ownerSearch')"
        class="rounded-lg border px-3 py-2"
      /><select v-model="filters.status" class="rounded-lg border px-3 py-2">
        <option value="">{{ t('admin.allStatus') }}</option>
        <option value="active">{{ t('manage.active') }}</option>
        <option value="expired">{{ t('manage.expired') }}</option></select
      ><select v-model="filters.spam" class="rounded-lg border px-3 py-2">
        <option value="">{{ t('admin.reportedAll') }}</option>
        <option value="reported">{{ t('admin.reported') }}</option>
        <option value="clean">{{ t('admin.clean') }}</option></select
      ><button class="rounded-lg bg-slate-900 px-4 text-white">{{ t('admin.search') }}</button>
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
            <th class="px-4 py-3">{{ t('admin.address') }}</th>
            <th class="px-4 py-3">{{ t('admin.owner') }}</th>
            <th class="px-4 py-3">{{ t('admin.target') }}</th>
            <th class="px-4 py-3">{{ t('admin.expires') }}</th>
            <th class="px-4 py-3">{{ t('admin.manage') }}</th>
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
                >{{ t('admin.reportCount') }} {{ link.reportCount }}</span
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
                {{ t('admin.delete') }}
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
