<script setup lang="ts">
import type { Ref } from "vue";

const show: Ref<boolean> = ref(false)
const router = useRouter()
const { loggedIn, user, session: _session, clear } = useUserSession()
</script>

<template>
  <nav class="border-b border-slate-200 bg-white/95 shadow-sm" role="navigation" aria-label="main navigation">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
      <NuxtLink class="flex items-center gap-2 font-bold text-slate-900" to="/">
        <img class="h-8 w-8 rounded-lg" src="/favicon.png" alt=""> sh0rt.kr
      </NuxtLink>
      <button type="button" class="rounded-lg p-2 text-slate-600 md:hidden" aria-label="메뉴" :aria-expanded="show" @click="show = !show">
        <span class="text-xl">☰</span>
      </button>
    </div>
    <div class="mx-auto max-w-7xl gap-1 px-4 pb-3 md:flex-row md:items-center md:justify-between md:pb-3" :class="show ? 'flex flex-col' : 'hidden md:flex'">
      <div class="flex flex-col gap-1 md:flex-row">
        <NuxtLink v-if="loggedIn" class="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" to="/create">단축주소 만들기</NuxtLink>
        <NuxtLink class="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" to="/privacy">개인정보 처리방침</NuxtLink>
        <NuxtLink class="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" to="/policy">이용약관</NuxtLink>
      </div>
      <div v-if="loggedIn" class="flex flex-col gap-1 md:flex-row md:items-center">
        <NuxtLink class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" to="/manage">
          <img class="h-7 w-7 rounded-full" :src="user?.profile" alt="사용자 프로필"><span>{{ user?.name }}</span>
        </NuxtLink>
        <button type="button" class="rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" @click="clear(); router.push('/')">로그아웃</button>
      </div>
      <NuxtLink v-else class="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" to="/login">로그인</NuxtLink>
    </div>
  </nav>
</template>
