<script setup lang="ts">
interface Stats {
  users: number;
  urls: number;
  activeUrls: number;
  expiredUrls: number;
  reports: number;
  openReports: number;
}
const { data } = await useFetch<{ stats: Stats }>('/api/admin/overview');
const stats = computed(
  () =>
    data.value?.stats ?? {
      users: 0,
      urls: 0,
      activeUrls: 0,
      expiredUrls: 0,
      reports: 0,
      openReports: 0,
    }
);
</script>
<template>
  <section class="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
    <article
      v-for="item in [
        ['사용자', stats.users],
        ['전체 링크', stats.urls],
        ['활성 링크', stats.activeUrls],
        ['만료 링크', stats.expiredUrls],
        ['전체 신고', stats.reports],
        ['처리 필요', stats.openReports],
      ]"
      :key="String(item[0])"
      class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <p class="text-xs text-slate-500">{{ item[0] }}</p>
      <p class="mt-1 text-2xl font-bold">{{ item[1] }}</p>
    </article>
  </section>
</template>
