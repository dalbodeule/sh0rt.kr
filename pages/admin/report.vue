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
const { t } = useI18n();
useSeoMeta({ title: `sh0rt.kr :: ${t('admin.reportTitle')}`, robots: { all: false } });
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
    errorMessage.value = t('report.error');
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
      <h1 class="mt-1 text-3xl font-bold text-slate-950">{{ t('admin.reportTitle') }}</h1>
    </header>
    <AdminStats /><AdminNav />
    <p v-if="errorMessage" class="rounded-xl bg-red-50 p-4 text-red-700">{{ errorMessage }}</p>
    <form
      class="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-5"
      @submit.prevent="search"
    >
      <input
        v-model="filters.q"
        :placeholder="t('admin.reportSearch')"
        class="rounded-lg border px-3 py-2 md:col-span-2"
      /><select v-model="filters.status" class="rounded-lg border px-3 py-2">
        <option value="">{{ t('admin.allStatus') }}</option>
        <option value="open">{{ t('admin.received') }}</option>
        <option value="reviewing">{{ t('admin.reviewing') }}</option>
        <option value="resolved">{{ t('admin.resolved') }}</option>
        <option value="dismissed">{{ t('admin.dismissed') }}</option></select
      ><select v-model="filters.source" class="rounded-lg border px-3 py-2">
        <option value="">{{ t('admin.allSources') }}</option>
        <option value="web">{{ t('admin.web') }}</option>
        <option value="email">{{ t('admin.email') }}</option></select
      ><button class="rounded-lg bg-slate-900 px-4 text-white">{{ t('admin.search') }}</button>
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
              #{{ report.id }} · {{ report.uid ? `/${report.uid}` : t('admin.noLink') }}
              <span class="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs">{{
                report.source
              }}</span>
            </p>
            <p class="mt-1 text-xs text-slate-500">
              {{ dayjs(report.created_at).format('YYYY-MM-DD HH:mm') }} ·
              {{ report.sender || report.reporter_email || t('admin.anonymous') }} ·
              {{ report.reason }}
            </p>
          </div>
          <select
            :value="report.status"
            class="rounded-lg border px-3 py-2 text-sm"
            @click.stop
            @change="update(report, ($event.target as HTMLSelectElement).value)"
          >
            <option value="open">{{ t('admin.received') }}</option>
            <option value="reviewing">{{ t('admin.reviewing') }}</option>
            <option value="resolved">{{ t('admin.resolved') }}</option>
            <option value="dismissed">{{ t('admin.dismissed') }}</option>
          </select>
        </div>
        <p v-if="report.subject" class="mt-4 font-semibold">{{ report.subject }}</p>
        <pre
          class="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm"
          >{{ report.body_text || report.details || t('report.details') }}</pre>
      </article>
      <p v-if="!data.items.length" class="rounded-xl bg-slate-100 p-6 text-slate-500">
        {{ t('admin.noReports') }}
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
              {{ selected.uid ? `/${selected.uid}` : t('admin.noLink') }}
            </h2>
          </div>
          <button class="rounded-lg border px-3 py-1" @click="selected = null">
            {{ t('admin.close') }}
          </button>
        </div>
        <dl class="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-slate-500">{{ t('report.reason') }}</dt>
            <dd class="font-semibold">{{ selected.reason }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">{{ t('admin.allSources') }}</dt>
            <dd class="font-semibold">{{ selected.source }}</dd>
          </div>
          <div>
            <dt class="text-slate-500">{{ t('admin.owner') }}</dt>
            <dd class="break-all font-semibold">
              {{ selected.sender || selected.reporter_email || t('admin.anonymous') }}
            </dd>
          </div>
          <div>
            <dt class="text-slate-500">{{ t('admin.target') }}</dt>
            <dd class="break-all font-semibold">{{ selected.forward || t('admin.noLink') }}</dd>
          </div>
        </dl>
        <p v-if="selected.subject" class="mt-5 font-semibold">{{ selected.subject }}</p>
        <pre
          class="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border p-4 text-sm"
          >{{ selected.body_text || selected.details || t('report.details') }}</pre>
        <div class="mt-6 flex justify-end gap-2">
          <button
            class="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 font-semibold text-amber-900"
            @click="updateSelected('dismissed')"
          >
            {{ t('admin.dismissed') }}</button
          ><button
            class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white"
            @click="updateSelected('resolved')"
          >
            {{ t('admin.resolved') }}
          </button>
        </div>
      </section>
    </div>
  </main>
</template>
