<template>
  <footer class="mt-12 border-t border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
    <div class="mx-auto flex max-w-7xl flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
      <p><strong class="text-slate-700">sh0rt.kr</strong> · AGPL-3.0 · © {{ new Date().getFullYear() }} dalbodeule</p>
      <div class="flex justify-center gap-4"><NuxtLink class="hover:text-slate-900" to="/report">악성 링크 신고</NuxtLink><NuxtLink class="hover:text-slate-900" to="/privacy">개인정보 처리방침</NuxtLink><NuxtLink class="hover:text-slate-900" to="/policy">이용약관</NuxtLink></div>
    </div>
  </footer>
</template>
