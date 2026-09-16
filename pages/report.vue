<script setup lang="ts">
const form = reactive({ uid: '', email: '', reason: 'spam', details: '', token: '' });
const submitting = ref(false);
const submitted = ref(false);
const errorMessage = ref('');
useSeoMeta({
  title: 'sh0rt.kr :: 링크 신고',
  description: '악성 또는 스팸 단축주소를 신고합니다.',
});

const submit = async () => {
  submitting.value = true;
  errorMessage.value = '';
  try {
    await $fetch('/api/report', { method: 'POST', body: form });
    submitted.value = true;
  } catch {
    errorMessage.value = '신고를 접수하지 못했습니다. 링크와 입력 내용을 확인해 주세요.';
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <main class="mx-auto max-w-2xl py-6">
    <header>
      <p class="text-sm font-semibold text-red-600">REPORT ABUSE</p>
      <h1 class="mt-1 text-3xl font-bold text-slate-950">악성 링크 신고</h1>
      <p class="mt-2 text-sm leading-6 text-slate-600">
        피싱, 스팸, 불법 콘텐츠 등 문제가 있는 sh0rt.kr 링크를 알려주세요. 이메일 신고는
        <a class="font-semibold text-blue-600" href="mailto:report@sh0rt.kr">report@sh0rt.kr</a
        >에서도 받습니다.
      </p>
    </header>
    <div
      v-if="submitted"
      class="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800"
    >
      <h2 class="font-bold">신고가 접수되었습니다.</h2>
      <p class="mt-1 text-sm">운영자가 확인한 뒤 필요한 조치를 진행합니다.</p>
    </div>
    <form
      v-else
      class="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="submit"
    >
      <label class="block"
        ><span class="text-sm font-semibold text-slate-800">신고할 링크</span
        ><input
          v-model="form.uid"
          required
          placeholder="https://sh0rt.kr/example 또는 example"
          class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
      /></label>
      <label class="block"
        ><span class="text-sm font-semibold text-slate-800">신고 유형</span
        ><select
          v-model="form.reason"
          class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
        >
          <option value="spam">스팸</option>
          <option value="phishing">피싱/계정 탈취</option>
          <option value="malware">악성코드</option>
          <option value="illegal">불법 콘텐츠</option>
          <option value="other">기타</option>
        </select></label
      >
      <label class="block"
        ><span class="text-sm font-semibold text-slate-800"
          >회신 이메일 <small class="font-normal text-slate-500">(선택)</small></span
        ><input
          v-model="form.email"
          type="email"
          maxlength="255"
          class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
      /></label>
      <label class="block"
        ><span class="text-sm font-semibold text-slate-800">상세 내용</span
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
        {{ submitting ? '접수 중…' : '신고 접수' }}
      </button>
    </form>
  </main>
</template>
