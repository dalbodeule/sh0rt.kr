<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faGithub, faGoogle } from '@fortawesome/free-brands-svg-icons'
const methods = [{ url: '/auth/google', display: 'Google로 계속하기', icon: faGoogle }, { url: '/auth/github', display: 'GitHub로 계속하기', icon: faGithub }]
useSeoMeta({ title: 'sh0rt.kr :: 로그인', description: 'sh0rt.kr 로그인', robots: { all: false } })
</script>

<template>
  <main class="mx-auto flex min-h-[65vh] max-w-md items-center py-10">
    <section class="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
      <div class="text-center"><img src="/favicon.png" alt="" class="mx-auto h-14 w-14 rounded-2xl"><h1 class="mt-5 text-2xl font-black text-slate-950">sh0rt.kr 로그인</h1><p class="mt-2 text-sm leading-6 text-slate-500">링크를 만들고 방문 통계를 확인하려면 로그인하세요.</p></div>
      <div class="mt-8 space-y-3"><a v-for="method in methods" :key="method.url" :href="method.url" class="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"><FontAwesomeIcon :icon="method.icon" class="h-5 w-5" />{{ method.display }}</a></div>
      <p class="mt-6 text-center text-xs leading-5 text-slate-400">로그인하면 <NuxtLink class="underline hover:text-slate-600" to="/policy">이용약관</NuxtLink>과 <NuxtLink class="underline hover:text-slate-600" to="/privacy">개인정보 처리방침</NuxtLink>에 동의하게 됩니다.</p>
    </section>
  </main>
</template>
