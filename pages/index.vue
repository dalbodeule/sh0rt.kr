<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faChartColumn, faLink, faQrcode } from '@fortawesome/free-solid-svg-icons'
const { loggedIn } = useUserSession()
useSeoMeta({ title: 'sh0rt.kr', description: '빠르고 안전한 URL 단축 서비스', robots: { all: true }, ogType: 'website', ogSiteName: 'sh0rt.kr', ogImage: '/favicon.png' })
const features = [
  { icon: faLink, title: '간단한 공유', description: '길고 복잡한 주소를 기억하고 공유하기 쉬운 링크로 바꿉니다.' },
  { icon: faChartColumn, title: '링크 분석', description: '국가, 브라우저, 언어, 기기별 방문 통계를 한눈에 확인합니다.' },
  { icon: faQrcode, title: 'QR 이미지', description: '만든 단축주소를 QR코드 이미지로 바로 내려받을 수 있습니다.' },
]
</script>

<template>
  <main class="space-y-16 pb-10 pt-4 sm:pt-8">
    <section class="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-16 text-white shadow-xl sm:px-12 sm:py-24">
      <div class="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
      <div class="absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
      <div class="relative mx-auto max-w-3xl text-center">
        <p class="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">Short links, clear insights</p>
        <h1 class="text-4xl font-black tracking-tight sm:text-6xl">긴 주소는 짧게,<br class="hidden sm:block"> 공유는 더 간단하게.</h1>
        <p class="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">안전한 리다이렉트와 방문 통계, QR코드까지 한 번에 제공하는 URL 단축 서비스입니다.</p>
        <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><NuxtLink :to="loggedIn ? '/create' : '/login'" class="rounded-xl bg-blue-500 px-6 py-3 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:bg-blue-400">{{ loggedIn ? '새 링크 만들기' : '무료로 시작하기' }}</NuxtLink><NuxtLink v-if="loggedIn" to="/manage" class="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold text-white hover:bg-white/15">내 링크 관리</NuxtLink></div>
      </div>
    </section>
    <section>
      <div class="mx-auto max-w-2xl text-center"><p class="text-sm font-semibold text-blue-600">WHY SH0RT.KR</p><h2 class="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">링크 관리에 필요한 핵심만 담았습니다</h2></div>
      <div class="mt-8 grid gap-5 md:grid-cols-3"><article v-for="feature in features" :key="feature.title" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FontAwesomeIcon :icon="feature.icon" class="h-5 w-5" /></div><h3 class="mt-5 text-lg font-bold text-slate-950">{{ feature.title }}</h3><p class="mt-2 text-sm leading-6 text-slate-600">{{ feature.description }}</p></article></div>
    </section>
  </main>
</template>
