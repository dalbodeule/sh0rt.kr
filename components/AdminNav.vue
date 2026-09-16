<script setup lang="ts"></script>
<template>
  <nav class="flex gap-2 border-b border-slate-200" aria-label="관리자 메뉴">
    <NuxtLink
      to="/admin/user"
      class="border-b-2 px-4 py-3 font-semibold"
      active-class="border-blue-600 text-blue-600"
      >사용자</NuxtLink
    >
    <NuxtLink
      to="/admin/url"
      class="border-b-2 px-4 py-3 font-semibold"
      active-class="border-blue-600 text-blue-600"
      >단축주소</NuxtLink
    >
    <NuxtLink
      to="/admin/report"
      class="border-b-2 px-4 py-3 font-semibold"
      active-class="border-blue-600 text-blue-600"
      >신고</NuxtLink
    >
  </nav>
</template>
