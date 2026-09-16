<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode?: number;
    statusMessage?: string;
    message?: string;
  };
}>();

const isNotFound = computed(() => props.error.statusCode === 404);
const isUnauthorized = computed(() => props.error.statusCode === 401);
const isForbidden = computed(() => props.error.statusCode === 403);
const statusCode = computed(() => props.error.statusCode || 500);
const title = computed(() => {
  if (isNotFound.value) return '페이지를 찾을 수 없어요';
  if (isUnauthorized.value) return '로그인이 필요해요';
  if (isForbidden.value) return '접근 권한이 없어요';
  return '잠시 문제가 생겼어요';
});
const description = computed(() =>
  isNotFound.value
    ? '요청하신 페이지가 없거나 주소가 변경되었을 수 있어요.'
    : isUnauthorized.value
      ? '이 페이지를 이용하려면 먼저 로그인해 주세요.'
      : isForbidden.value
        ? '현재 계정으로는 이 페이지를 이용할 수 없어요.'
        : '서버에서 요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.',
);
const primaryActionLabel = computed(() => (isUnauthorized.value ? '로그인하러 가기' : '홈으로 돌아가기'));

const clearErrorAndContinue = () => clearError({ redirect: isUnauthorized.value ? '/login' : '/' });
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-50 text-slate-950">
    <header class="border-b border-slate-200/80 bg-white/90">
      <div class="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
        <NuxtLink class="flex items-center gap-2.5 text-lg font-black tracking-tight" to="/">
          <img class="h-9 w-9 rounded-xl" src="/favicon.png" alt="" />
          sh0rt.kr
        </NuxtLink>
      </div>
    </header>

    <main class="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <section class="w-full max-w-xl text-center">
        <div
          class="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-100 text-4xl shadow-sm ring-8 ring-blue-50"
          aria-hidden="true"
        >
          {{ isNotFound ? '🔎' : isUnauthorized ? '🔐' : isForbidden ? '🚫' : '🛠️' }}
        </div>
        <p class="mb-3 text-sm font-bold tracking-[0.2em] text-blue-600">ERROR {{ statusCode }}</p>
        <h1 class="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{{ title }}</h1>
        <p class="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">{{ description }}</p>

        <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            class="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            type="button"
            @click="clearErrorAndContinue"
          >
            {{ primaryActionLabel }}
          </button>
        </div>
      </section>
    </main>

    <footer class="border-t border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
      <strong class="text-slate-700">sh0rt.kr</strong> · 짧고 간편한 링크
    </footer>
  </div>
</template>
