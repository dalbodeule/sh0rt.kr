<script setup lang="ts">
const isPageLoading = useState<boolean>('page-loading', () => false);
const { t } = useI18n();
</script>

<template>
  <Transition name="page-loading">
    <div
      v-if="isPageLoading"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 px-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      :aria-label="t('common.loading')"
    >
      <div
        class="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/95 px-5 py-4 shadow-xl"
      >
        <span class="loading-spinner" aria-hidden="true" />
        <span class="text-sm font-semibold text-slate-700">{{ t('common.loading') }}</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.loading-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 3px solid rgb(226 232 240);
  border-top-color: rgb(37 99 235);
  border-radius: 9999px;
  animation: loading-spin 0.8s linear infinite;
}

.page-loading-enter-active,
.page-loading-leave-active {
  transition: opacity 160ms ease;
}

.page-loading-enter-from,
.page-loading-leave-to {
  opacity: 0;
}

@keyframes loading-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation-duration: 1.6s;
  }
}
</style>
