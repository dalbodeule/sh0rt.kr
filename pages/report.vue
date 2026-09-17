<script setup lang="ts">
const form = reactive({ uid: '', email: '', reason: 'spam', details: '', token: '' });
const { t } = useI18n();
const { $csrfFetch } = useNuxtApp();
const submitting = ref(false);
const submitted = ref(false);
const errorMessage = ref('');
useSeoMeta({
  title: `sh0rt.kr :: ${t('report.title')}`,
  description: t('report.description'),
});

const submit = async () => {
  submitting.value = true;
  errorMessage.value = '';
  try {
    await $csrfFetch('/api/report', { method: 'POST', body: form });
    submitted.value = true;
  } catch {
    errorMessage.value = t('report.error');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <main class="mx-auto max-w-2xl py-6">
    <header>
      <p class="text-sm font-semibold text-red-600">REPORT ABUSE</p>
      <h1 class="mt-1 text-3xl font-bold text-slate-950">{{ t('report.title') }}</h1>
      <p class="mt-2 text-sm leading-6 text-slate-600">
        {{ t('report.description') }} 이메일 신고는
        <a class="font-semibold text-blue-600" href="mailto:report@sh0rt.kr">report@sh0rt.kr</a
        >에서도 받습니다.
      </p>
    </header>
    <div
      v-if="submitted"
      class="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800"
    >
      <h2 class="font-bold">{{ t('report.success') }}</h2>
      <p class="mt-1 text-sm">{{ t('report.successDescription') }}</p>
    </div>
    <form
      v-else
      class="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="submit"
    >
      <label class="block"
        ><span class="text-sm font-semibold text-slate-800">{{ t('report.link') }}</span
        ><input
          v-model="form.uid"
          required
          :placeholder="t('report.linkPlaceholder')"
          class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
      /></label>
      <label class="block"
        ><span class="text-sm font-semibold text-slate-800">{{ t('report.reason') }}</span
        ><select
          v-model="form.reason"
          class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
        >
          <option value="spam">{{ t('report.spam') }}</option>
          <option value="phishing">{{ t('report.phishing') }}</option>
          <option value="malware">{{ t('report.malware') }}</option>
          <option value="illegal">{{ t('report.illegal') }}</option>
          <option value="other">{{ t('report.other') }}</option>
        </select></label
      >
      <label class="block"
        ><span class="text-sm font-semibold text-slate-800"
          >{{ t('report.email') }}
          <small class="font-normal text-slate-500">({{ t('report.optional') }})</small></span
        ><input
          v-model="form.email"
          type="email"
          maxlength="255"
          class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
      /></label>
      <label class="block"
        ><span class="text-sm font-semibold text-slate-800">{{ t('report.details') }}</span
        ><textarea
          v-model="form.details"
          maxlength="5000"
          rows="5"
          class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </label>
      <NuxtTurnstile v-model="form.token" :options="{ theme: 'light', size: 'flexible' }" />
      <p v-if="errorMessage" role="alert" class="text-sm text-red-700">{{ errorMessage }}</p>
      <button
        :disabled="submitting || !form.token"
        class="rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-50"
      >
        {{ submitting ? t('report.submitting') : t('report.submit') }}
      </button>
    </form>
  </main>
</template>
