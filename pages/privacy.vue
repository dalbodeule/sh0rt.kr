<script setup lang="ts">
const { t } = useI18n();
useSeoMeta({
  title: `sh0rt.kr :: ${t('legal.privacyTitle')}`,
  description: t('home.description'),
  robots: { all: true },
});
</script>

<template>
  <LegalDocument document="privacy" />
</template>
