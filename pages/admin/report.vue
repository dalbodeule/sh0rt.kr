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
  ai_status: string;
  ai_likely_abuse: number | null;
  ai_category: string | null;
  ai_severity: number | null;
  ai_confidence: number | null;
  ai_checked_at: string | null;
  ai_error: string | null;
  created_at: string;
  ownerId: number | null;
  ownerName: string | null;
  ownerEmail: string | null;
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
const { $csrfFetch } = useNuxtApp();
const actionError = ref('');
const actionPending = ref(false);
const aiPending = ref(false);
const actionOptions = reactive({
  suspendUser: false,
  suspension: '7d' as '7d' | '30d' | 'permanent',
  expireUrl: true,
  blacklist: false,
});
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
  await $csrfFetch(`/api/admin/report/${report.id}`, { method: 'PATCH', body: { status } });
  await load();
};
const openReport = (report: Report) => {
  selected.value = report;
  actionError.value = '';
  actionOptions.suspendUser = false;
  actionOptions.suspension = '7d';
  actionOptions.expireUrl = Boolean(report.uid);
  actionOptions.blacklist = false;
};
const reviewWithAi = async () => {
  if (!selected.value || aiPending.value) return;
  aiPending.value = true;
  actionError.value = '';
  try {
    await $csrfFetch(`/api/admin/report/${selected.value.id}/ai`, { method: 'POST' });
    await load();
    selected.value = data.value.items.find((item) => item.id === selected.value?.id) ?? null;
  } catch {
    actionError.value = t('admin.aiError');
  } finally {
    aiPending.value = false;
  }
};
const applyReportAction = async (status: 'resolved' | 'dismissed', applyMeasures = true) => {
  if (!selected.value || actionPending.value) return;
  actionPending.value = true;
  actionError.value = '';
  try {
    await $csrfFetch(`/api/admin/report/${selected.value.id}/action`, {
      method: 'POST',
      body: {
        status,
        suspendUser: applyMeasures && actionOptions.suspendUser,
        suspension: actionOptions.suspension,
        expireUrl: applyMeasures && actionOptions.expireUrl,
        blacklist: applyMeasures && actionOptions.blacklist,
      },
    });
    selected.value = null;
    await load();
  } catch {
    actionError.value = t('admin.actionError');
  } finally {
    actionPending.value = false;
  }
};

const { loggedIn, user, fetch: fetchUserSession } = useUserSession();
await fetchUserSession();

if (
  !loggedIn.value ||
  !(user.value?.role === UserRole.MODERATOR || user.value?.role === UserRole.ADMIN)
) {
  await navigateTo('/');
} else {
  await load();
}
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
        @click="openReport(report)"
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
              {{ selected.ownerName || selected.ownerEmail || t('admin.noLink') }}
            </dd>
          </div>
          <div>
            <dt class="text-slate-500">{{ t('admin.target') }}</dt>
            <dd class="break-all font-semibold">{{ selected.forward || t('admin.noLink') }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-slate-500">{{ t('admin.aiReview') }}</dt>
            <dd class="mt-1 flex flex-wrap items-center gap-2 font-semibold">
              <span
                :class="[
                  'rounded-full px-2 py-1 text-xs',
                  selected.ai_likely_abuse === 1
                    ? 'bg-red-100 text-red-700'
                    : selected.ai_likely_abuse === 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : selected.ai_status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-700',
                ]"
              >
                {{
                  selected.ai_status === 'completed'
                    ? selected.ai_likely_abuse === 1
                      ? t('admin.aiLikelyAbuse')
                      : t('admin.aiNeedsReview')
                    : selected.ai_status === 'processing'
                      ? t('admin.aiProcessing')
                      : selected.ai_status === 'unavailable'
                        ? t('admin.aiUnavailable')
                        : selected.ai_status === 'failed'
                          ? t('admin.aiFailed')
                          : t('admin.aiNotChecked')
                }}
              </span>
              <span v-if="selected.ai_category" class="text-sm text-slate-600">
                {{ t(`report.${selected.ai_category}`) }} · {{ t('admin.aiSeverity') }}
                {{
                  selected.ai_severity === 2
                    ? t('admin.aiSeverityHigh')
                    : selected.ai_severity === 1
                      ? t('admin.aiSeverityModerate')
                      : t('admin.aiSeverityLow')
                }}
                · {{ t('admin.aiConfidence') }} {{ selected.ai_confidence ?? 0 }}%
              </span>
              <span v-if="selected.ai_status === 'failed'" class="text-sm font-normal text-red-700">
                {{ t('admin.aiError') }}
              </span>
              <button
                class="rounded-lg border px-3 py-1 text-sm font-medium"
                :disabled="aiPending"
                @click="void reviewWithAi"
              >
                {{ aiPending ? t('admin.processing') : t('admin.aiRecheck') }}
              </button>
            </dd>
          </div>
        </dl>
        <p v-if="selected.subject" class="mt-5 font-semibold">{{ selected.subject }}</p>
        <pre
          class="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border p-4 text-sm"
          >{{ selected.body_text || selected.details || t('report.details') }}</pre>
        <div class="mt-6 space-y-4 rounded-xl border border-slate-200 p-4">
          <h3 class="font-bold text-slate-900">{{ t('admin.actionTitle') }}</h3>
          <label v-if="selected.ownerId" class="flex items-center gap-2 text-sm">
            <input v-model="actionOptions.suspendUser" type="checkbox" class="h-4 w-4" />
            {{ t('admin.suspendOwner') }}
          </label>
          <label v-if="actionOptions.suspendUser" class="block text-sm">
            <span class="font-semibold text-slate-700">{{ t('admin.suspensionPeriod') }}</span>
            <select
              v-model="actionOptions.suspension"
              class="mt-2 w-full rounded-lg border px-3 py-2"
            >
              <option value="7d">{{ t('admin.suspend7d') }}</option>
              <option value="30d">{{ t('admin.suspend30d') }}</option>
              <option value="permanent">{{ t('admin.suspendPermanent') }}</option>
            </select>
          </label>
          <label v-if="selected.uid" class="flex items-center gap-2 text-sm">
            <input v-model="actionOptions.expireUrl" type="checkbox" class="h-4 w-4" />
            {{ t('admin.expireReportedUrl') }}
          </label>
          <label v-if="selected.uid" class="flex items-center gap-2 text-sm">
            <input v-model="actionOptions.blacklist" type="checkbox" class="h-4 w-4" />
            {{ t('admin.addToBlacklist') }}
          </label>
          <p v-if="actionError" role="alert" class="text-sm text-red-700">{{ actionError }}</p>
          <div class="flex flex-wrap justify-end gap-2">
            <button
              class="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 font-semibold text-amber-900"
              :disabled="actionPending"
              @click="void applyReportAction('dismissed', false)"
            >
              {{ t('admin.dismissed') }}
            </button>
            <button
              class="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
              :disabled="actionPending"
              @click="void applyReportAction('resolved')"
            >
              {{ actionPending ? t('admin.processing') : t('admin.applyAction') }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
