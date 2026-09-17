<script setup lang="ts">
const props = defineProps<{ value: string }>();
const { t } = useI18n();
const canvas = ref<HTMLCanvasElement | null>(null);
const ready = ref(false);
const error = ref(false);

const render = async () => {
  if (import.meta.server) return;
  if (!canvas.value || !props.value) return;
  try {
    const { default: QRCode } = await import('qrcode');
    await QRCode.toCanvas(canvas.value, props.value, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
    ready.value = true;
    error.value = false;
  } catch {
    error.value = true;
  }
};

const download = () => {
  if (!canvas.value || !ready.value) return;
  const link = document.createElement('a');
  link.download = 'sh0rt-qr.png';
  link.href = canvas.value.toDataURL('image/png');
  link.click();
};

watch(() => props.value, render);
onMounted(render);
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 class="text-lg font-bold text-slate-900">{{ t('qr.alt') }}</h2>
    <p class="mt-1 break-all text-sm text-slate-500">{{ value }}</p>
    <div class="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
      <div class="rounded-xl border border-slate-200 bg-white p-2">
        <canvas
          ref="canvas"
          class="h-auto max-w-full"
          width="256"
          height="256"
          :aria-label="t('qr.alt')"
        />
      </div>
      <button
        type="button"
        class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!ready"
        @click="download"
      >
        {{ t('qr.download') }}
      </button>
    </div>
    <p v-if="error" class="mt-3 text-sm text-red-600">{{ t('create.error') }}</p>
  </section>
</template>
