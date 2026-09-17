<script setup lang="ts">
const { t } = useI18n();
const { notice, close } = useAppNotice();
</script>

<template>
  <Teleport to="body">
    <div v-if="notice" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        v-if="notice.type === 'confirm'"
        class="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        @click="close()"
      />
      <div
        class="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
        :class="notice.type === 'confirm' ? '' : 'mt-6 self-start sm:mt-10'"
        role="status"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black"
            :class="{
              'bg-blue-100 text-blue-700': notice.type === 'info',
              'bg-emerald-100 text-emerald-700': notice.type === 'success',
              'bg-red-100 text-red-700': notice.type === 'error',
              'bg-amber-100 text-amber-700': notice.type === 'confirm',
            }"
          >
            {{ notice.type === 'confirm' ? '?' : notice.type === 'error' ? '!' : 'i' }}
          </div>
          <p class="pt-1 text-sm leading-6 text-slate-700">{{ notice.message }}</p>
        </div>
        <div v-if="notice.type === 'confirm'" class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            @click="close()"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            @click="close(true)"
          >
            {{ t('common.confirm') }}
          </button>
        </div>
        <button
          v-else
          type="button"
          class="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          :aria-label="t('common.close')"
          @click="close()"
        >
          ×
        </button>
      </div>
    </div>
  </Teleport>
</template>
