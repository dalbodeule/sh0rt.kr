<script setup lang="ts">
import type { Ref } from "vue";
import { UserRole } from "~/server/db/schema"

const show: Ref<boolean> = ref(false)
const router = useRouter()
const { loggedIn, user, session, clear } = useUserSession()
</script>

<template>
  <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <NuxtLink class="navbar-item" to="/">
        <img src="~/public/favicon.png" alt=""/>&nbsp; sh0rt.kr
      </NuxtLink>
    </div>
    <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" @click="show = !show">
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </a>
    <div class="navbar-menu" v-bind:class="show ? 'is-active' : ''">
      <div class="navbar-start">
        <NuxtLink class="navbar-item" to="/create" v-if="loggedIn">단축주소 만들기</NuxtLink>
        <NuxtLink class="navbar-item" to="/domain" v-if="loggedIn">서브도메인 만들기</NuxtLink>
        <NuxtLink class="navbar-item" to="/privacy">개인정보 처리방침</NuxtLink>
      </div>
      <div class="navbar-end" v-if="loggedIn">
        <NuxtLink to="/manage" class="navbar-item">
          <img v-bind:src="user?.profile" alt="user profile"/>
          <span>&nbsp; {{ user?.name}}</span>
        </NuxtLink>
        <button type="button" class="navbar-item" v-if="user?.role == UserRole.ADMIN || user?.role == UserRole.MODERATOR">관리자 페이지</button>
        <button type="button" class="navbar-item" @click="clear(); router.push('/')">로그아웃</button>
      </div>
      <div class="navbar-end" v-else>
        <NuxtLink class="navbar-item" to="/login">로그인</NuxtLink>
      </div>
    </div>
  </nav>
</template>