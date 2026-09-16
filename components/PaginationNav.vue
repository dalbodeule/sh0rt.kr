<script setup lang="ts">
defineProps<{ page: number, pages: number }>()
defineEmits<{ change: [page: number] }>()
</script>
<template><nav class="flex items-center justify-center gap-3"><button :disabled="page <= 1" class="rounded-lg border px-4 py-2 disabled:opacity-40" @click="$emit('change', page - 1)">이전</button><span class="text-sm text-slate-600">{{ page }} / {{ pages }}</span><button :disabled="page >= pages" class="rounded-lg border px-4 py-2 disabled:opacity-40" @click="$emit('change', page + 1)">다음</button></nav></template>
