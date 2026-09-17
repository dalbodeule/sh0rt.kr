<script setup lang="ts">
import dayjs from 'dayjs';
import { UserRole } from '~/common/userRole';
interface AdminUser {
  id: number;
  email: string;
  name: string;
  vendor: string;
  profile: string;
  created_at: string;
  login_limit: string | null;
  role: number;
  urlCount: number;
}
interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
const { loggedIn, user, fetch: fetchUserSession } = useUserSession();
const { $csrfFetch } = useNuxtApp();
definePageMeta({ middleware: 'admin' });
const { t } = useI18n();
useSeoMeta({ title: `sh0rt.kr :: ${t('admin.userTitle')}`, robots: { all: false } });
const filters = reactive({ q: '', vendor: '', status: '', joinedFrom: '', joinedTo: '' });
const data = ref<Paged<AdminUser>>({ items: [], page: 1, pageSize: 20, total: 0 });
const errorMessage = ref('');
const suspensionTarget = ref<AdminUser | null>(null);
const suspensionType = ref('7d');
const suspensionDate = ref('');
const pages = computed(() => Math.max(1, Math.ceil(data.value.total / data.value.pageSize)));
const queryValues = (value: Record<string, string>) =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item));
const isSuspended = (member: AdminUser) =>
  !!member.login_limit && new Date(member.login_limit).getTime() > Date.now();
const isPermanent = (member: AdminUser) =>
  !!member.login_limit && new Date(member.login_limit).getFullYear() >= 9999;
const load = async () => {
  try {
    data.value = await useRequestFetch()<Paged<AdminUser>>('/api/admin/users', {
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
const updateUser = async (
  target: AdminUser,
  changes: { role?: number; suspendedUntil?: string | null; permanent?: boolean }
) => {
  try {
    await $csrfFetch(`/api/admin/user/${target.id}`, { method: 'PATCH', body: changes });
    await load();
  } catch {
    errorMessage.value = t('manage.loadError');
  }
};
const applySuspension = async () => {
  if (!suspensionTarget.value) return;
  let until: string | null | undefined;
  const permanent = suspensionType.value === 'permanent';
  if (suspensionType.value === 'release') until = null;
  else if (suspensionType.value === 'custom')
    until = new Date(`${suspensionDate.value}T23:59:59`).toISOString();
  else if (!permanent)
    until = new Date(
      Date.now() + Number(suspensionType.value.replace('d', '')) * 86400000
    ).toISOString();
  await updateUser(suspensionTarget.value, { suspendedUntil: until, permanent });
  suspensionTarget.value = null;
};
const openLinks = (member: AdminUser) =>
  navigateTo({ path: '/admin/url', query: { userId: String(member.id) } });

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
      <p class="text-sm font-semibold text-blue-600">ADMIN CONSOLE / USER</p>
      <h1 class="mt-1 text-3xl font-bold text-slate-950">{{ t('admin.userTitle') }}</h1>
    </header>
    <AdminStats /><AdminNav />
    <p v-if="errorMessage" role="alert" class="rounded-xl bg-red-50 p-4 text-red-700">
      {{ errorMessage }}
    </p>
    <form
      class="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-6"
      @submit.prevent="search"
    >
      <input
        v-model="filters.q"
        :placeholder="t('admin.nameEmail')"
        class="rounded-lg border px-3 py-2 md:col-span-2"
      /><select v-model="filters.vendor" class="rounded-lg border px-3 py-2">
        <option value="">{{ t('admin.allOAuth') }}</option>
        <option value="github">GitHub</option>
        <option value="google">Google</option></select
      ><select v-model="filters.status" class="rounded-lg border px-3 py-2">
        <option value="">{{ t('admin.allStatus') }}</option>
        <option value="active">{{ t('admin.normal') }}</option>
        <option value="suspended">{{ t('admin.suspended') }}</option></select
      ><input v-model="filters.joinedFrom" type="date" class="rounded-lg border px-3 py-2" />
      <div class="flex gap-2">
        <input
          v-model="filters.joinedTo"
          type="date"
          class="min-w-0 flex-1 rounded-lg border px-3 py-2"
        /><button class="rounded-lg bg-slate-900 px-4 text-white">{{ t('admin.search') }}</button>
      </div>
    </form>
    <div class="overflow-x-auto rounded-2xl border bg-white">
      <table class="min-w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th class="px-4 py-3">{{ t('admin.users') }}</th>
            <th class="px-4 py-3">{{ t('manage.created') }}</th>
            <th class="px-4 py-3">{{ t('admin.urls') }}</th>
            <th class="px-4 py-3">권한</th>
            <th class="px-4 py-3">{{ t('admin.allStatus') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="member in data.items" :key="member.id">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <img :src="member.profile" alt="" class="h-9 w-9 rounded-full" />
                <div>
                  <p class="font-semibold">{{ member.name }}</p>
                  <p class="text-xs text-slate-500">{{ member.email }} · {{ member.vendor }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">{{ dayjs(member.created_at).format('YYYY-MM-DD') }}</td>
            <td class="px-4 py-3">
              <button class="font-semibold text-blue-600" @click="openLinks(member)">
                {{ member.urlCount }} {{ t('admin.urls') }}
              </button>
            </td>
            <td class="px-4 py-3">
              <select
                :value="member.role"
                :disabled="user?.role !== UserRole.ADMIN || member.id === user?.id"
                class="rounded-lg border px-2 py-1"
                @change="
                  updateUser(member, { role: Number(($event.target as HTMLSelectElement).value) })
                "
              >
                <option :value="UserRole.USER">{{ t('admin.users') }}</option>
                <option :value="UserRole.MODERATOR">운영자</option>
                <option :value="UserRole.ADMIN">{{ t('nav.admin') }}</option>
              </select>
            </td>
            <td class="px-4 py-3">
              <button
                v-if="user?.role === UserRole.ADMIN && member.id !== user?.id"
                class="rounded-lg px-3 py-1.5 font-semibold"
                :class="
                  isSuspended(member) ? 'bg-amber-100 text-amber-900' : 'bg-red-50 text-red-700'
                "
                @click="
                  suspensionTarget = member;
                  suspensionType = isSuspended(member) ? 'release' : '7d';
                "
              >
                {{
                  isSuspended(member)
                    ? isPermanent(member)
                      ? '영구 정지'
                      : `~ ${dayjs(member.login_limit).format('YYYY-MM-DD')}`
                    : '정지 설정'
                }}</button
              ><span v-else>—</span>
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
    <div
      v-if="suspensionTarget"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      @click.self="suspensionTarget = null"
    >
      <form
        class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        @submit.prevent="applySuspension"
      >
        <h2 class="text-xl font-bold">{{ suspensionTarget.name }} 로그인 정지</h2>
        <div class="mt-5 space-y-2">
          <label
            v-for="option in [
              { v: '1d', l: '1일' },
              { v: '7d', l: '7일' },
              { v: '30d', l: '30일' },
              { v: 'custom', l: '직접 지정' },
              { v: 'permanent', l: '영구 정지' },
              { v: 'release', l: '정지 해제' },
            ]"
            :key="option.v"
            class="flex items-center gap-3 rounded-lg border p-3"
            ><input v-model="suspensionType" type="radio" :value="option.v" />{{ option.l }}</label
          >
        </div>
        <input
          v-if="suspensionType === 'custom'"
          v-model="suspensionDate"
          required
          type="date"
          class="mt-3 w-full rounded-lg border px-3 py-2"
        />
        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border px-4 py-2"
            @click="suspensionTarget = null"
          >
            {{ t('admin.cancel') }}</button
          ><button class="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
            {{ t('admin.apply') }}
          </button>
        </div>
      </form>
    </div>
  </main>
</template>
