<script setup lang="ts">
import { UserRole } from '~/common/userRole'
const show = ref(false)
const router = useRouter()
const { loggedIn, user, clear } = useUserSession()
watch(() => router.currentRoute.value.fullPath, () => { show.value = false })
const logout = async () => { await clear(); await navigateTo('/') }
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
      <NuxtLink class="flex items-center gap-2.5 text-lg font-black tracking-tight text-slate-950" to="/"><img class="h-9 w-9 rounded-xl" src="/favicon.png" alt="sh0rt.kr 로고">sh0rt.kr</NuxtLink>
      <nav class="hidden items-center gap-1 md:flex" aria-label="주 메뉴">
        <NuxtLink v-if="loggedIn" class="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" to="/create">링크 만들기</NuxtLink><NuxtLink v-if="loggedIn" class="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100" to="/manage">내 링크</NuxtLink><NuxtLink v-if="user && user.role >= UserRole.MODERATOR" class="rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50" to="/admin">관리자</NuxtLink>
        <template v-if="loggedIn"><span class="mx-2 h-5 w-px bg-slate-200"/><span class="flex items-center gap-2 px-2 text-sm text-slate-600"><img class="h-7 w-7 rounded-full bg-slate-100" :src="user?.profile" alt="">{{ user?.name }}</span><button type="button" class="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100" @click="logout">로그아웃</button></template><NuxtLink v-else class="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800" to="/login">로그인</NuxtLink>
      </nav>
      <button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg text-xl text-slate-700 hover:bg-slate-100 md:hidden" aria-label="메뉴" :aria-expanded="show" @click="show = !show">{{ show ? '×' : '☰' }}</button>
    </div>
    <nav v-if="show" class="space-y-1 border-t border-slate-100 px-4 py-3 md:hidden" aria-label="모바일 메뉴"><NuxtLink v-if="loggedIn" class="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-100" to="/create">링크 만들기</NuxtLink><NuxtLink v-if="loggedIn" class="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-100" to="/manage">내 링크</NuxtLink><NuxtLink v-if="user && user.role >= UserRole.MODERATOR" class="block rounded-lg px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50" to="/admin">관리자</NuxtLink><button v-if="loggedIn" type="button" class="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-100" @click="logout">로그아웃</button><NuxtLink v-else class="block rounded-lg bg-slate-950 px-3 py-2.5 text-center text-sm font-bold text-white" to="/login">로그인</NuxtLink></nav>
  </header>
</template>
