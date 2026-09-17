<script setup lang="ts">
const { t } = useI18n();
useSeoMeta({
  title: `sh0rt.kr :: ${t('legal.policyTitle')}`,
  description: t('home.description'),
  robots: { all: true },
});
</script>

<template>
  <LegalDocument document="policy" />
</template>
