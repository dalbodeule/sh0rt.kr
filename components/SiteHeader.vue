<script setup lang="ts">
import type { Ref } from "vue";
import { UserRole } from "~/server/db/schema"

const show: Ref<boolean> = ref(false)
const router = useRouter()
const { loggedIn, user, session: _session, clear } = useUserSession()
</script>

<template>
  <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <NuxtLink class="navbar-item" to="/">
        <img src="~/public/favicon.png" alt="">&nbsp; sh0rt.kr
      </NuxtLink>
    </div>
    <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" @click="show = !show">
      <span aria-hidden="true"/>
      <span aria-hidden="true"/>
      <span aria-hidden="true"/>
      <span aria-hidden="true"/>
    </a>
    <div class="navbar-menu" :class="show ? 'is-active' : ''">
      <div class="navbar-start">
        <NuxtLink v-if="loggedIn" class="navbar-item" to="/create">단축주소 만들기</NuxtLink>
        <NuxtLink v-if="loggedIn" class="navbar-item" to="/domain">서브도메인 만들기</NuxtLink>
        <NuxtLink class="navbar-item" to="/ddns">DDNS 설정</NuxtLink>
        <NuxtLink class="navbar-item" to="/privacy">개인정보 처리방침</NuxtLink>
      </div>
      <div v-if="loggedIn" class="navbar-end">
        <NuxtLink to="/manage" class="navbar-item">
          <img :src="user?.profile" alt="user profile">
          <span>&nbsp; {{ user?.name}}</span>
        </NuxtLink>
        <button v-if="user?.role == UserRole.ADMIN || user?.role == UserRole.MODERATOR" type="button" class="navbar-item">관리자 페이지</button>
        <button type="button" class="navbar-item" @click="clear(); router.push('/')">로그아웃</button>
      </div>
      <div v-else class="navbar-end">
        <NuxtLink class="navbar-item" to="/login">로그인</NuxtLink>
      </div>
    </div>
  </nav>
</template>