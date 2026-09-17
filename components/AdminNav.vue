<script setup lang="ts">
const { t } = useI18n();
</script>
<template>
  <nav class="flex gap-2 border-b border-slate-200" :aria-label="t('admin.menu')">
    <NuxtLink
      to="/admin/user"
      class="border-b-2 px-4 py-3 font-semibold"
      active-class="border-blue-600 text-blue-600"
      >{{ t('admin.users') }}</NuxtLink
    >
    <NuxtLink
      to="/admin/url"
      class="border-b-2 px-4 py-3 font-semibold"
      active-class="border-blue-600 text-blue-600"
      >{{ t('admin.urls') }}</NuxtLink
    >
    <NuxtLink
      to="/admin/report"
      class="border-b-2 px-4 py-3 font-semibold"
      active-class="border-blue-600 text-blue-600"
      >{{ t('admin.reports') }}</NuxtLink
    >
  </nav>
</template>
