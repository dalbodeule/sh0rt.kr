<script setup lang="ts">
import SiteFooter from '~/components/SiteFooter.vue';
import SiteHeader from '~/components/SiteHeader.vue';

const { locale } = useI18n();
useHead(() => ({ htmlAttrs: { lang: locale.value } }));
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <SiteHeader />
    <div class="mx-auto min-h-[80vh] max-w-7xl px-4 py-5">
      <NuxtPage />
    </div>
    <SiteFooter />
  </div>
</template>
