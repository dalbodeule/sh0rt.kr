<script setup lang="ts">
const { locale, setLocale } = useI18n();
const changingLocale = ref(false);

const locales = [
  { code: 'ko', flag: '🇰🇷', label: '한국어' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'ja', flag: '🇯🇵', label: '日本語' },
] as const;
type LocaleCode = (typeof locales)[number]['code'];

const changeLocale = async (event: Event) => {
  const nextLocale = (event.target as HTMLSelectElement).value as LocaleCode;
  if (nextLocale === locale.value) return;

  changingLocale.value = true;
  try {
    await setLocale(nextLocale);
  } finally {
    changingLocale.value = false;
  }
};
</script>

<template>
  <label class="sr-only" for="locale-switcher">언어 선택</label>
  <select
    id="locale-switcher"
    class="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-600 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 md:mr-[10px]"
    :value="locale"
    :disabled="changingLocale"
    @change="changeLocale"
  >
    <option v-for="item in locales" :key="item.code" :value="item.code">
      {{ item.flag }} {{ item.label }}
    </option>
  </select>
</template>
