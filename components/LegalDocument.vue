<script setup lang="ts">
import { marked } from 'marked';

const props = defineProps<{ document: 'policy' | 'privacy' }>();
const { locale } = useI18n();
const source = ref('');
const loading = ref(true);
const loadError = ref(false);
const renderer = new marked.Renderer();
const stripHtmlTags = (value: string) =>
  value
    .replace(/<[^>]*>/g, '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Legal documents are static, but stripping raw HTML keeps a compromised document
// from becoming executable content in the application shell.
renderer.html = () => '';
renderer.link = ({ href, title, text }) => {
  const safeText = stripHtmlTags(text);
  const value = href.trim();
  try {
    const url = new URL(value, 'https://sh0rt.kr');
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return safeText;
  } catch {
    return safeText;
  }

  const escapeAttribute = (attribute: string) =>
    attribute.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const titleAttribute = title ? ` title="${escapeAttribute(title)}"` : '';
  return `<a href="${escapeAttribute(value)}"${titleAttribute} rel="noopener noreferrer">${safeText}</a>`;
};
renderer.image = ({ text }) => stripHtmlTags(text);

const load = async () => {
  loading.value = true;
  loadError.value = false;
  try {
    source.value = await $fetch<string>(`/legal/${props.document}_${locale.value}.md`);
  } catch {
    source.value = '';
    loadError.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(load);
watch(locale, load);

const rendered = computed(() =>
  marked.parse(source.value ?? '', {
    async: false,
    breaks: true,
    renderer,
  })
);
</script>

<template>
  <main class="box content mx-auto max-w-4xl text-slate-700 sm:p-8 lg:p-10">
    <div v-if="loading" class="space-y-3" aria-busy="true">
      <div class="h-8 w-2/3 animate-pulse rounded-lg bg-slate-100" />
      <div class="h-4 w-full animate-pulse rounded bg-slate-100" />
      <div class="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
    </div>
    <p v-else-if="loadError" class="rounded-xl bg-red-50 p-4 text-red-700" role="alert">
      문서를 불러오지 못했습니다.
    </p>
    <!-- Legal documents are bundled static files maintained by the project. -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <article v-else class="legal-document prose prose-slate max-w-none" v-html="rendered" />
  </main>
</template>

<style scoped>
.legal-document :deep(h1) {
  margin-bottom: 2rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  line-height: 1.3;
  letter-spacing: -0.025em;
}

.legal-document :deep(h2),
.legal-document :deep(h3) {
  margin-top: 2.75rem;
  margin-bottom: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  line-height: 1.5;
}

.legal-document :deep(p),
.legal-document :deep(li) {
  line-height: 1.9;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.legal-document :deep(p) {
  margin: 0.9rem 0;
}

.legal-document :deep(blockquote) {
  margin: 0 0 2.5rem;
  border-left: 4px solid #3b82f6;
  border-radius: 0 0.75rem 0.75rem 0;
  background: #eff6ff;
  padding: 1rem 1.25rem;
  color: #1e3a8a;
  font-style: normal;
}

.legal-document :deep(blockquote p) {
  margin: 0;
}

.legal-document :deep(ul),
.legal-document :deep(ol) {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.legal-document :deep(li + li) {
  margin-top: 0.5rem;
}

@media (max-width: 640px) {
  .legal-document :deep(h2),
  .legal-document :deep(h3) {
    margin-top: 2.25rem;
    padding-top: 1.25rem;
  }

  .legal-document :deep(p),
  .legal-document :deep(li) {
    line-height: 1.8;
    word-break: normal;
  }
}
</style>
